import { promises as fs } from 'node:fs';
import path from 'node:path';

let cache = null;
let cachePath = null;

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    return false;
  }
}

export async function getJMDict() {
  if (cache) {
    return cache;
  }

  const dataDir = path.join(process.cwd(), 'shared', 'data');
  const customPath = path.join(dataDir, 'jmdict.min.json');
  const samplePath = path.join(dataDir, 'jmdict.sample.json');

  if (!cachePath && (await fileExists(customPath))) {
    cachePath = customPath;
  }

  if (!cachePath) {
    cachePath = samplePath;
  }

  try {
    const raw = await fs.readFile(cachePath, 'utf-8');
    cache = JSON.parse(raw);
    return cache;
  } catch (error) {
    console.error('Failed to load JMdict dataset:', error);
    cache = null;
    return null;
  }
}

export function resetJMDictCache() {
  cache = null;
  cachePath = null;
}
