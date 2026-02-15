export interface StorageProviderResult {
  key: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface StorageProvider {
  upload(buffer: Buffer, destinationKey: string, mimeType?: string): Promise<StorageProviderResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

export default {};
