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
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import { finished } from 'stream/promises';


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
    // Prefer stream download when available to avoid buffering large files entirely in RAM
    const tmpDir = os.tmpdir();
    const baseName = `${crypto.randomUUID()}-${stagingKey.split('/').pop()}`;
    const tempIn = path.join(tmpDir, baseName);
    const hasDownloadStream = typeof (this.storage as any).downloadStream === 'function';
    if (hasDownloadStream) {
      // stream to temp file
      await fsPromises.mkdir(path.dirname(tempIn), { recursive: true }).catch(() => {});
      const read = (this.storage as any).downloadStream(stagingKey) as NodeJS.ReadableStream;
      const write = fs.createWriteStream(tempIn);
      read.pipe(write);
      await finished(write);
    } else {
      const buffer = await this.storage.download(stagingKey);
      await fsPromises.writeFile(tempIn, buffer);
    }

    // determine mime
    const mime = job.data.mimeType || 'application/octet-stream';

    try {
      // simple branching by mime
      let finalKey = `final/${crypto.randomUUID()}-${stagingKey.split('/').pop()}`;
      let thumbnailUrl: string | undefined;
      let metadata: any = {};

      if (mime.startsWith('image/')) {
        // process image from temp file to avoid buffering in memory
        const optName = `opt-${baseName}`;
        const optPath = path.join(tmpDir, optName);
        const thumbName = `thumb-${baseName}.jpg`;
        const thumbPath = path.join(tmpDir, thumbName);

        await sharp(tempIn).toFile(optPath);
        await sharp(tempIn).resize({ width: 200 }).toFile(thumbPath);
        const meta = await sharp(tempIn).metadata();
        metadata = { width: meta.width, height: meta.height, format: meta.format };

        // upload optimized and thumbnail using stream upload if available
        if (typeof (this.storage as any).uploadStream === 'function') {
          const optStream = fs.createReadStream(optPath);
          const uploadRes = await (this.storage as any).uploadStream(optStream, finalKey, mime);
          const thumbStream = fs.createReadStream(thumbPath);
          const thumbRes = await (this.storage as any).uploadStream(thumbStream, `thumbs/${crypto.randomUUID()}-${stagingKey.split('/').pop()}`, mime);
          thumbnailUrl = thumbRes.url;
          finalKey = uploadRes.key;
        } else {
          const optBuf = await fsPromises.readFile(optPath);
          const uploadRes = await this.storage.upload(optBuf, finalKey, mime);
          const thumbBuf = await fsPromises.readFile(thumbPath);
          const thumbRes = await this.storage.upload(thumbBuf, `thumbs/${crypto.randomUUID()}-${stagingKey.split('/').pop()}`, mime);
          thumbnailUrl = thumbRes.url;
          finalKey = uploadRes.key;
        }
        // cleanup temp files
        try { await fsPromises.unlink(optPath); } catch (_) {}
        try { await fsPromises.unlink(thumbPath); } catch (_) {}
      } else if (mime.startsWith('video/')) {
        // process video files via temp files so ffmpeg works without buffering entire file
        const tempOut = path.join(tmpDir, `out-${baseName}.mp4`);
        await new Promise<void>((resolve, reject) => {
          ffmpeg(tempIn).videoCodec('libx264').outputOptions(['-preset', 'fast']).save(tempOut).on('end', resolve).on('error', reject);
        });

        let uploadRes: any;
        if (typeof (this.storage as any).uploadStream === 'function') {
          const outStream = fs.createReadStream(tempOut);
          uploadRes = await (this.storage as any).uploadStream(outStream, finalKey, 'video/mp4');
        } else {
          const outBuf = await fsPromises.readFile(tempOut);
          uploadRes = await this.storage.upload(outBuf, finalKey, 'video/mp4');
        }

        // thumbnail
        const thumbName = `thumb-${baseName}.jpg`;
        await new Promise<void>((resolve, reject) => {
          ffmpeg(tempOut)
            .screenshots({ count: 1, folder: tmpDir, filename: thumbName })
            .on('end', resolve)
            .on('error', reject);
        });
        try {
          if (typeof (this.storage as any).uploadStream === 'function') {
              const tstream = fs.createReadStream(path.join(tmpDir, thumbName));
              const thumbRes = await (this.storage as any).uploadStream(tstream, `thumbs/${crypto.randomUUID()}-${stagingKey.split('/').pop()}`, 'image/jpeg');
            thumbnailUrl = thumbRes.url;
          } else {
            const thumbBuf = await fsPromises.readFile(path.join(tmpDir, thumbName));
            const thumbRes = await this.storage.upload(thumbBuf, `thumbs/${crypto.randomUUID()}-${stagingKey.split('/').pop()}`, 'image/jpeg');
            thumbnailUrl = thumbRes.url;
          }
        } catch (_) {}
        metadata = { /* could probe for duration/size using ffprobe if needed */ };
        try { await fsPromises.unlink(tempIn); await fsPromises.unlink(tempOut); await fsPromises.unlink(path.join(tmpDir, thumbName)); } catch (_) {}
        finalKey = uploadRes.key;
      } else if (mime.startsWith('audio/')) {
        // probe audio file and upload without buffering whole stream when possible
        let probe: any = undefined;
        try {
          probe = await new Promise<any>((resolve, reject) => {
            ffmpeg.ffprobe(tempIn, (err: any, data: any) => (err ? reject(err) : resolve(data)));
          });
        } catch (_) {
          probe = undefined;
        }
        const duration = probe?.format?.duration ? Number(probe.format.duration) : undefined;
        const bitrate = probe?.format?.bit_rate ? Number(probe.format.bit_rate) : undefined;
        let uploadRes;
        if (typeof (this.storage as any).uploadStream === 'function') {
          uploadRes = await (this.storage as any).uploadStream(fs.createReadStream(tempIn), finalKey, mime);
        } else {
          const buf = await fsPromises.readFile(tempIn);
          uploadRes = await this.storage.upload(buf, finalKey, mime);
        }
        metadata = { duration, bitrate };
        try { await fsPromises.unlink(tempIn); } catch (_) {}
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
    } finally {
      // ensure temp files are cleaned even on unexpected errors
      const candidates = [
        tempIn,
        path.join(tmpDir, `out-${baseName}.mp4`),
        path.join(tmpDir, `opt-${baseName}`),
        path.join(tmpDir, `thumb-${baseName}.jpg`),
      ];
      for (const p of candidates) {
        try { await fsPromises.unlink(p); } catch (_) {}
      }
    }
    
  }
}

export default {};
