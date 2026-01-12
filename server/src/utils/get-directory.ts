import fs from 'fs';
import path from 'path';
 


export function getStoredProjectDirectory(): string | null {
  const dataFile = path.join(process.cwd(), 'data', 'data.json');

  if (!fs.existsSync(dataFile)) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(dataFile, 'utf8');
    const jsonData = JSON.parse(fileContent || '{}');

    return jsonData.project.projectDirectory || null;
  } catch (error) {
    console.error('Failed to read projectDirectory from data.json');
    return null;
  }
}
