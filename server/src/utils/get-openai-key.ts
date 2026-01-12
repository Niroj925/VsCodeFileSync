import fs from "fs";
import path from "path";

export function getOpenaiKey(): { key: string | null } {
  const dataFile = path.join(process.cwd(), "data", "data.json");

  if (!fs.existsSync(dataFile)) {
    return { key: null };
  }

  try {
    const fileContent = fs.readFileSync(dataFile, "utf8");
    const jsonData = JSON.parse(fileContent || "{}");

    if (!Array.isArray(jsonData.providers)) {
      return { key: null };
    }

    const openaiProvider = jsonData.providers.find(
      (provider: any) => provider.name === "openai"
    );

    if (!openaiProvider || typeof openaiProvider.apiKey !== "string") {
      return { key: null };
    }

    return { key: openaiProvider.apiKey };
  } catch (error) {
    console.error("❌ Failed to read OpenAI API key:", error);
    return { key: null };
  }
}
