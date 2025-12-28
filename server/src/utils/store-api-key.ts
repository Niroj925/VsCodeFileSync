import fs from 'fs';
import path from 'path';

interface ApiKeyData {
  name: string;
  apiKey: string;
}

export function saveApiKey(name: string, apiKey: string): void {
  const dataDir = path.join(process.cwd(), 'data');
  const dataFile = path.join(dataDir, 'data.json');

  // Ensure data folder exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let jsonData: Record<string, any> = {};

  // If file exists, read existing data
  if (fs.existsSync(dataFile)) {
    try {
      const fileContent = fs.readFileSync(dataFile, 'utf8');
      jsonData = JSON.parse(fileContent || '{}');
    } catch (err) {
      console.error('Failed to read data.json, resetting file');
      jsonData = {};
    }
  }

  // Ensure providers array exists
  if (!Array.isArray(jsonData.providers)) {
    jsonData.providers = [];
  }

  // Check if provider exists, update if yes
  const index = jsonData.providers.findIndex((k: ApiKeyData) => k.name === name);
  if (index !== -1) {
    jsonData.providers[index].apiKey = apiKey;
  } else {
    // Append new key
    jsonData.providers.push({ name, apiKey });
  }

  // Write back to file
  fs.writeFileSync(dataFile, JSON.stringify(jsonData, null, 2), 'utf8');
}
