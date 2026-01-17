import { Project } from '../types';
import fs from 'fs';
import path from 'path';

export function getSavedProject(): Project | null {
  const dataDir = path.resolve(process.cwd(), 'data');
  const dataFile = path.resolve(dataDir, 'data.json');

  if (!fs.existsSync(dataFile)) {
    console.warn('⚠️ data.json not found');
    return null;
  }

  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const jsonData = raw ? JSON.parse(raw) : {};

    if (!jsonData.project) {
      return null;
    }

    const project: Project = {
      name: jsonData.project.name,
      projectDirectory: jsonData.project.projectDirectory,
      files: jsonData.project.files ?? [],
      lastSynced: new Date(jsonData.project.lastSynced),
    };

    return project;
  } catch (err) {
    console.error('❌ Failed to read project from data.json:', err);
    return null;
  }
}
