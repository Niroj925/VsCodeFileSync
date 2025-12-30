import fs from "fs";
import path from "path";

export function saveModel(name: string, newModels: string[]): void {
  const dataDir = path.join(process.cwd(), "data");
  const dataFile = path.join(dataDir, "data.json");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let jsonData: Record<string, any> = {};

  if (fs.existsSync(dataFile)) {
    try {
      const fileContent = fs.readFileSync(dataFile, "utf8");
      jsonData = JSON.parse(fileContent || "{}");
    } catch (err) {
      console.error("Failed to read data.json, resetting file");
      jsonData = {};
    }
  }

  if (!Array.isArray(jsonData.providers)) {
    jsonData.providers = [];
  }

  const providerIndex = jsonData.providers.findIndex(
    (p: any) => p.name === name
  );

  if (providerIndex !== -1) {
    const existingModels = Array.isArray(
      jsonData.providers[providerIndex].models
    )
      ? jsonData.providers[providerIndex].models
      : [];

    const mergedModels = Array.from(new Set([...existingModels, ...newModels]));
    jsonData.providers[providerIndex].models = mergedModels;
  } else {
    jsonData.providers.push({
      name,
      models: newModels,
    });
  }

  fs.writeFileSync(dataFile, JSON.stringify(jsonData, null, 2), "utf8");
  console.log(`✅ Model(s) for provider "${name}" saved successfully`);
}

export function getModelsByProvider(name: string): string[] {
  const dataDir = path.join(process.cwd(), "data");
  const dataFile = path.join(dataDir, "data.json");

  if (!fs.existsSync(dataFile)) {
    console.warn("⚠️ data.json not found, returning empty models array");
    return [];
  }

  try {
    const fileContent = fs.readFileSync(dataFile, "utf8");
    const jsonData = JSON.parse(fileContent || "{}");

    if (!Array.isArray(jsonData.providers)) return [];

    const provider = jsonData.providers.find((p: any) => p.name === name);

    if (!provider || !Array.isArray(provider.models)) return [];

    return provider.models;
  } catch (err) {
    console.error("❌ Failed to read data.json:", err);
    return [];
  }
}
