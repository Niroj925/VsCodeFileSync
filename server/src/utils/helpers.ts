import fs from 'fs-extra';
import path from 'path';

export async function getAllFilesInFolder(
  folderPath: string, 
  basePath = ""
): Promise<Array<{ path: string; content: string; size: number }>> {
  const files: Array<{ path: string; content: string; size: number }> = [];

  try {
    const items = await fs.readdir(folderPath);

    for (const item of items) {
      if (item === "node_modules" || item.startsWith(".")) continue;

      const itemPath = path.join(folderPath, item);
      const relativePath = path.join(basePath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        const subFiles = await getAllFilesInFolder(itemPath, relativePath);
        files.push(...subFiles);
      } else {
        try {
          const content = await fs.readFile(itemPath, "utf8");
          files.push({
            path: relativePath,
            content: content,
            size: content.length,
          });
        } catch (e) {
          // Skip binary files
          console.log(`Skipping binary file: ${relativePath}`);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading ${folderPath}:`, err);
  }

  return files;
}

export function getSnippet(content: string, query: string, context = 100): string {
  const index = content.toLowerCase().indexOf(query.toLowerCase());

  if (index === -1) return "";

  const start = Math.max(0, index - context);
  const end = Math.min(content.length, index + query.length + context);

  let snippet = content.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  return snippet;
}