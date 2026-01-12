import { Project } from '../types';
import fs from 'fs';
import path from 'path';

export function saveProjectDirectory(project: Project) {
  const rootDir = process.cwd();
  const dataDir = path.resolve(rootDir, 'data');
  const dataFile = path.resolve(dataDir, 'data.json');

  console.log('📁 Writing project data to:', dataFile);

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let jsonData: Record<string, any> = {};

    if (fs.existsSync(dataFile)) {
      try {
        const raw = fs.readFileSync(dataFile, 'utf8');
        jsonData = raw ? JSON.parse(raw) : {};
      } catch (err) {
        console.error('❌ Failed to parse existing data.json, recreating');
        jsonData = {};
      }
    }

    jsonData.project = {
      name: project.name,
      projectDirectory: project.srcFolder,
      lastSynced: project.lastSynced
    };

    fs.writeFileSync(
      dataFile,
      JSON.stringify(jsonData, null, 2),
      'utf8'
    );

    console.log('✅ Project data written successfully');
  } catch (err) {
    console.error('🔥 Failed to write project data:', err);
  }
}
