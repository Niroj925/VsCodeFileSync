import fs from "fs";
import path from "path";

interface CurrentModelProvider {
  provider: string;
  model: string;
}

export function saveCurrentModelProvider(
  provider: string,
  model: string
): void {
  const dataDir = path.join(process.cwd(), "data");
  const dataFile = path.join(dataDir, "data.json");

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let jsonData: Record<string, any> = {};

  // Read existing data.json if exists
  if (fs.existsSync(dataFile)) {
    try {
      const fileContent = fs.readFileSync(dataFile, "utf8");
      jsonData = JSON.parse(fileContent || "{}");
    } catch (err) {
      console.error("❌ Failed to read data.json, resetting file");
      jsonData = {};
    }
  }

  // Set or update currentModelProvider object
  jsonData.currentModelProvider = {
    provider,
    model,
  } satisfies CurrentModelProvider;

  // Write back to data.json
  fs.writeFileSync(dataFile, JSON.stringify(jsonData, null, 2), "utf8");
}
