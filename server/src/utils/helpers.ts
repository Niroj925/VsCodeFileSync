import fs from "fs-extra";
import path from "path";

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
          console.log(`Skipping binary file: ${relativePath}`);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading ${folderPath}:`, err);
  }

  return files;
}

export function getSnippet(
  content: string,
  query: string,
  context = 100
): string {
  const index = content.toLowerCase().indexOf(query.toLowerCase());

  if (index === -1) return "";

  const start = Math.max(0, index - context);
  const end = Math.min(content.length, index + query.length + context);

  let snippet = content.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  return snippet;
}

export function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "ts":
      return "typescript";
    case "js":
      return "javascript";
    case "tsx":
      return "typescript";
    case "jsx":
      return "javascript";
    case "py":
      return "python";
    case "java":
      return "java";
    case "cpp":
      return "cpp";
    case "cs":
      return "csharp";
    case "go":
      return "go";
    case "rb":
      return "ruby";
    case "php":
      return "php";
    case "rs":
      return "rust";
    case "html":
      return "html";
    case "css":
      return "css";
    case "scss":
      return "scss";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "yml":
    case "yaml":
      return "yaml";
    default:
      return "text";
  }
}
