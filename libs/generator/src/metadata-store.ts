import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { MetadataStore, MetadataStoreRecord } from './types';

export class MetadataStoreManager {
  private readonly metadataPath: string;

  constructor(path: string) {
    this.metadataPath = path;
  }

  load(): MetadataStore {
    if (!existsSync(this.metadataPath)) {
      return {};
    }
    const content = readFileSync(this.metadataPath, 'utf8');
    try {
      return JSON.parse(content) as MetadataStore;
    } catch (error) {
      throw new Error(`Failed to parse metadata store at ${this.metadataPath}: ${(error as Error).message}`);
    }
  }

  save(store: MetadataStore): void {
    const dir = dirname(this.metadataPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.metadataPath, JSON.stringify(store, null, 2), 'utf8');
  }

  updateRecord(key: string, record: MetadataStoreRecord): void {
    const store = this.load();
    store[key] = record;
    this.save(store);
  }
}
