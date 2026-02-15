import { StorageProvider, StorageProviderResult } from './storage.provider';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'multimedia');

async function ensureDir() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
}

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  constructor() {}

  async upload(buffer: Buffer, destinationKey: string, mimeType?: string): Promise<StorageProviderResult> {
    await ensureDir();
    // destinationKey may include folders; sanitize
    const key = destinationKey || `local/${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const outPath = path.join(UPLOAD_DIR, key.replace(/\//g, path.sep));
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    await fs.promises.writeFile(outPath, buffer);
    const url = `/uploads/multimedia/${key}`;
    return { key, url, size: buffer.length, mimeType };
  }

  async download(key: string): Promise<Buffer> {
    const p = path.join(UPLOAD_DIR, key.replace(/\//g, path.sep));
    return fs.promises.readFile(p);
  }

  async delete(key: string): Promise<void> {
    const p = path.join(UPLOAD_DIR, key.replace(/\//g, path.sep));
    try { await fs.promises.unlink(p); } catch (_) {}
  }

  getPublicUrl(key: string): string {
    return `/uploads/multimedia/${key}`;
  }
}

export default {};
