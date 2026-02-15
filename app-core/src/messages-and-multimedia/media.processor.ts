import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

// image processing
import sharp from 'sharp';

// ffmpeg for video/audio metadata and thumbnails
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

ffmpeg.setFfmpegPath(ffmpegPath || undefined);
ffmpeg.setFfprobePath((ffprobePath && (ffprobePath as any).path) || undefined);

export type MultimediaProcessingResult = {
  url: string;
  type: 'image' | 'video' | 'audio';
  metadata?: any;
  cleanup?: () => Promise<void>;
};

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'multimedia');

async function ensureUploadDir() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
}

function filenameFor(originalName: string) {
  const ext = path.extname(originalName) || '';
  return `${Date.now()}-${uuidv4()}${ext}`;
}

export async function processMultimediaFile(file: Express.Multer.File): Promise<MultimediaProcessingResult> {
  await ensureUploadDir();

  const mimetype = file.mimetype || '';

  if (mimetype.startsWith('image/')) {
    return processImage(file);
  }

  if (mimetype.startsWith('video/')) {
    return processVideo(file);
  }

  if (mimetype.startsWith('audio/')) {
    return processAudio(file);
  }

  throw new Error('Unsupported media type');
}

async function processImage(file: Express.Multer.File): Promise<MultimediaProcessingResult> {
  const fname = filenameFor(file.originalname || 'img');
  const outPath = path.join(UPLOAD_DIR, fname);
  const thumbName = `thumb-${fname}`;
  const thumbPath = path.join(UPLOAD_DIR, thumbName);

  // Validate/convert using sharp and create thumbnail
  const image = sharp(file.buffer);
  const meta = await image.metadata();

  // Save optimized main file - convert to webp if large
  const pipeline = image.clone();
  if (meta.format === 'jpeg' || meta.format === 'png' || meta.format === 'webp') {
    await pipeline.toFile(outPath);
  } else {
    await pipeline.toFormat('jpeg').toFile(outPath);
  }

  // create thumbnail (200px width)
  await sharp(file.buffer).resize({ width: 200 }).toFile(thumbPath);

  const cleanup = async () => {
    try { await fs.promises.unlink(outPath); } catch (_) {}
    try { await fs.promises.unlink(thumbPath); } catch (_) {}
  };

  return {
    url: `/uploads/multimedia/${path.basename(outPath)}`,
    type: 'image',
    metadata: { width: meta.width, height: meta.height, format: meta.format, thumb: `/uploads/multimedia/${path.basename(thumbPath)}` },
    cleanup,
  };
}

async function ffprobe(filePath: string) {
  const probe = promisify((ffmpeg as any).ffprobe).bind(ffmpeg);
  return probe(filePath);
}

async function processVideo(file: Express.Multer.File): Promise<MultimediaProcessingResult> {
  const fname = filenameFor(file.originalname || 'vid');
  const outPath = path.join(UPLOAD_DIR, fname);
  await fs.promises.writeFile(outPath, file.buffer);

  // extract metadata
  const metadata = await ffprobe(outPath).catch(() => null);

  // generate a thumbnail (first frame)
  const thumbName = `thumb-${fname}.jpg`;
  const thumbPath = path.join(UPLOAD_DIR, thumbName);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(outPath)
      .screenshots({ count: 1, folder: UPLOAD_DIR, filename: thumbName, size: '320x?' })
      .on('end', () => resolve())
      .on('error', (err: any) => {
        // if thumbnail fails, continue without it
        resolve();
      });
  });

  const cleanup = async () => {
    try { await fs.promises.unlink(outPath); } catch (_) {}
    try { await fs.promises.unlink(thumbPath); } catch (_) {}
  };

  return {
    url: `/uploads/multimedia/${path.basename(outPath)}`,
    type: 'video',
    metadata,
    cleanup,
  };
}

async function processAudio(file: Express.Multer.File): Promise<MultimediaProcessingResult> {
  const fname = filenameFor(file.originalname || 'aud');
  const outPath = path.join(UPLOAD_DIR, fname);
  await fs.promises.writeFile(outPath, file.buffer);

  // extract metadata (duration)
  const metadata = await ffprobe(outPath).catch(() => null);

  const cleanup = async () => {
    try { await fs.promises.unlink(outPath); } catch (_) {}
  };

  return {
    url: `/uploads/multimedia/${path.basename(outPath)}`,
    type: 'audio',
    metadata,
    cleanup,
  };
}

export default {};
