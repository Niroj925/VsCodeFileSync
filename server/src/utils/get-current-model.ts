import fs from "fs";
import path from "path";

interface CurrentModelProvider {
  provider: string;
  model: string;
}

export function getCurrentModelProvider(): CurrentModelProvider | null {
  const dataFile = path.join(process.cwd(), "data", "data.json");

  if (!fs.existsSync(dataFile)) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(dataFile, "utf8");
    const jsonData = JSON.parse(fileContent || "{}");

    if (
      jsonData.currentModelProvider &&
      typeof jsonData.currentModelProvider.provider === "string" &&
      typeof jsonData.currentModelProvider.model === "string"
    ) {
      return {
        provider: jsonData.currentModelProvider.provider,
        model: jsonData.currentModelProvider.model,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Failed to read currentModelProvider:", error);
    return null;
  }
}
