import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LocalStorageProvider } from 'src/storage/local.storage.provider';
import { Multimedia, MultimediaDocument } from './schemas/multimedia.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';


ffmpeg.setFfmpegPath(ffmpegPath || undefined);
ffmpeg.setFfprobePath((ffprobePath && (ffprobePath as any).path) || undefined);

@Processor('multimedia')
@Injectable()
export class MultimediaProcessor {
  constructor(
    private readonly storage: LocalStorageProvider,
    @InjectModel(Multimedia.name) private multimediaModel: Model<MultimediaDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process('process')
  async handle(job: Job) {
    const { stagingKey, multimediaId } = job.data;

    // download object from storage provider (staging)
    const buffer = await this.storage.download(stagingKey);

    // determine mime
    const mime = job.data.mimeType || 'application/octet-stream';

    try {
      // simple branching by mime
      let finalKey = `final/${Date.now()}-${stagingKey.split('/').pop()}`;
      let thumbnailUrl: string | undefined;
      let metadata: any = {};

      if (mime.startsWith('image/')) {
        // optimize image
        const optimized = await sharp(buffer).toBuffer();
        const uploadRes = await this.storage.upload(optimized, finalKey, mime);
        // thumbnail
        const thumb = await sharp(buffer).resize({ width: 200 }).toBuffer();
        const thumbRes = await this.storage.upload(thumb, `thumbs/${Date.now()}-${stagingKey.split('/').pop()}` , mime);
        thumbnailUrl = thumbRes.url;
        const meta = await sharp(buffer).metadata();
        metadata = { width: meta.width, height: meta.height, format: meta.format };
        finalKey = uploadRes.key;
      } else if (mime.startsWith('video/')) {
        // write buffer to temp, process with ffmpeg - convert/compress
        const tmpDir = os.tmpdir();
        const baseName = `${Date.now()}-${stagingKey.split('/').pop()}`;
        const tempIn = path.join(tmpDir, baseName);
        const tempOut = path.join(tmpDir, `out-${baseName}.mp4`);
        await fs.writeFile(tempIn, buffer);
        await new Promise<void>((resolve, reject) => {
          ffmpeg(tempIn).videoCodec('libx264').outputOptions(['-preset', 'fast']).save(tempOut).on('end', resolve).on('error', reject);
        });
        const outBuf = await fs.readFile(tempOut);
        const uploadRes = await this.storage.upload(outBuf, finalKey, 'video/mp4');
        // thumbnail
        const thumbName = `thumb-${baseName}.jpg`;
        await new Promise<void>((resolve, reject) => {
          ffmpeg(tempOut)
            .screenshots({ count: 1, folder: tmpDir, filename: thumbName })
            .on('end', resolve)
            .on('error', reject);
        });
        let thumbBuf: Buffer | undefined;
        try { thumbBuf = await fs.readFile(path.join(tmpDir, thumbName)); const thumbRes = await this.storage.upload(thumbBuf, `thumbs/${Date.now()}-${stagingKey.split('/').pop()}`, 'image/jpeg'); thumbnailUrl = thumbRes.url; } catch (_) {}
        metadata = { /* could probe for duration/size using ffprobe if needed */ };
        try { await fs.unlink(tempIn); await fs.unlink(tempOut); await fs.unlink(path.join(tmpDir, thumbName)); } catch (_) {}
        finalKey = uploadRes.key;
      } else if (mime.startsWith('audio/')) {
        // write buffer to temp, probe with ffprobe for duration/bitrate
        const tmpDir = os.tmpdir();
        const baseName = `${Date.now()}-${stagingKey.split('/').pop()}`;
        const tempIn = path.join(tmpDir, baseName);
        await fs.writeFile(tempIn, buffer);
        let probe: any = undefined;
        try {
          probe = await new Promise<any>((resolve, reject) => {
            // ffmpeg.ffprobe uses the configured ffprobe binary
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            ffmpeg.ffprobe(tempIn, (err: any, data: any) => (err ? reject(err) : resolve(data)));
          });
        } catch (_) {
          probe = undefined;
        }
        const duration = probe?.format?.duration ? Number(probe.format.duration) : undefined;
        const bitrate = probe?.format?.bit_rate ? Number(probe.format.bit_rate) : undefined;
        const uploadRes = await this.storage.upload(buffer, finalKey, mime);
        metadata = { duration, bitrate };
        try { await fs.unlink(tempIn); } catch (_) {}
        finalKey = uploadRes.key;
      }

      // update multimedia doc
      await this.multimediaModel.findByIdAndUpdate(multimediaId, {
        url: this.storage.getPublicUrl(finalKey),
        thumbnailUrl,
        status: 'ready',
        ...metadata,
      }).exec();

      // emit event so realtime clients can update (thumbnail, url, metadata)
      try {
        this.eventEmitter.emit('multimedia.ready', {
          multimediaId: multimediaId,
          messageId: job.data.messageId,
          url: this.storage.getPublicUrl(finalKey),
          thumbnailUrl,
          metadata,
        });
      } catch (_) {}

      // delete staging
      try { await this.storage.delete(stagingKey); } catch (_) {}
    } catch (err) {
      await this.multimediaModel.findByIdAndUpdate(multimediaId, { status: 'failed' }).exec();
      throw err;
    }
  }
}

export default {};
