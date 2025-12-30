export function findFileForCode(
  codeContent: string,
  contextFiles: Array<{ path: string; content: string }>
): string | null {
  if (!contextFiles.length) return null;

  for (const file of contextFiles) {
    if (codeContent.includes(file.path)) {
      return file.path;
    }
  }

  for (const file of contextFiles) {
    if (file.content && codeContent) {
      const fileFirstLines = file.content.split("\n").slice(0, 3).join("\n");
      const codeFirstLines = codeContent.split("\n").slice(0, 3).join("\n");

      if (fileFirstLines === codeFirstLines) {
        return file.path;
      }

      const fileLines = file.content.split("\n");
      const codeLines = codeContent.split("\n");

      let matchingLines = 0;
      for (const codeLine of codeLines.slice(0, 10)) {
        if (
          fileLines.some(
            (fileLine) => fileLine.includes(codeLine) && codeLine.length > 10
          )
        ) {
          matchingLines++;
        }
      }

      if (matchingLines >= 2) {
        return file.path;
      }
    }
  }

  return null;
}
