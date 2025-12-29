import fs from 'fs';
import path from 'path';

export function saveModel(name: string, newModels: string[]): void {
  const dataDir = path.join(process.cwd(), 'data');
  const dataFile = path.join(dataDir, 'data.json');

  // Ensure data folder exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let jsonData: Record<string, any> = {};

  // Read existing data if file exists
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

  // Find provider
  const providerIndex = jsonData.providers.findIndex(
    (p: any) => p.name === name
  );

  if (providerIndex !== -1) {
    // Provider exists: merge models
    const existingModels = Array.isArray(jsonData.providers[providerIndex].models)
      ? jsonData.providers[providerIndex].models
      : [];

    // Add only new models (avoid duplicates)
    const mergedModels = Array.from(new Set([...existingModels, ...newModels]));
    jsonData.providers[providerIndex].models = mergedModels;

  } else {
    // Provider does not exist: add new
    jsonData.providers.push({
      name,
      models: newModels
    });
  }

  // Write back to file
  fs.writeFileSync(dataFile, JSON.stringify(jsonData, null, 2), 'utf8');
  console.log(`✅ Model(s) for provider "${name}" saved successfully`);
}


export function getModelsByProvider(name: string): string[] {
  const dataDir = path.join(process.cwd(), 'data');
  const dataFile = path.join(dataDir, 'data.json');

  if (!fs.existsSync(dataFile)) {
    console.warn('⚠️ data.json not found, returning empty models array');
    return [];
  }

  try {
    const fileContent = fs.readFileSync(dataFile, 'utf8');
    const jsonData = JSON.parse(fileContent || '{}');

    if (!Array.isArray(jsonData.providers)) return [];

    const provider = jsonData.providers.find((p: any) => p.name === name);

    if (!provider || !Array.isArray(provider.models)) return [];

    return provider.models;
  } catch (err) {
    console.error('❌ Failed to read data.json:', err);
    return [];
  }
}
