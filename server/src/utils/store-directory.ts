import fs from 'fs';
import path from 'path';
 

export function saveProjectDirectory(srcFolder: string): void {
  const dataDir = path.join(process.cwd(), 'data');
  const dataFile = path.join(dataDir, 'data.json');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let jsonData: Record<string, any> = {};

  if (fs.existsSync(dataFile)) {
    try {
      const fileContent = fs.readFileSync(dataFile, 'utf8');
      jsonData = JSON.parse(fileContent || '{}');
    } catch (err) {
      console.error('Failed to read data.json, resetting file');
    }
  }

  jsonData.projectDirectory = srcFolder;

  fs.writeFileSync(dataFile, JSON.stringify(jsonData, null, 2), 'utf8');
}
