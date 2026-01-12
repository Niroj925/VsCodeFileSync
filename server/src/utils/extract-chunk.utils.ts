import { Project, SyntaxKind } from "ts-morph";
import path from "path";

export function extractChunks() {
  const chunks = [];

  const astProject = new Project({
    tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
    skipAddingFilesFromTsConfig: false,
  });

  
  const sourceFiles = astProject
    .getSourceFiles()
    .filter(
      (sf) =>
        !sf.isDeclarationFile() && !sf.getFilePath().includes("node_modules")
    );

  for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();

    for (const cls of sf.getClasses()) {
      const className = cls.getName();
      if (!className) continue;

      for (const method of cls.getMethods()) {
        const calls = method
          .getDescendantsOfKind(SyntaxKind.CallExpression)
          .map((call) => {
            const symbol = call.getExpression().getSymbol();
            if (!symbol) return null;
            return resolveFullSymbolName(symbol);
          })
          .filter(Boolean);

        const startLine = method.getStartLineNumber();
        const endLine = method.getEndLineNumber();
        // const docs = method.getJsDoc()?.getComment() ?? "";
        const docs = method
          .getJsDocs()
          .map((doc) => doc.getComment())
          .join("\n");

        chunks.push({
          symbol: `${className}.${method.getName()}`,
          filePath,
          type: "method",
          lineRange: [startLine, endLine],
          calls,
          content: `
Symbol: ${className}.${method.getName()}
File: ${filePath}
Type: Method
Description: ${docs}

Code:
${method.getText()}
          `.trim(),
        });
      }
    }

    for (const fn of sf.getFunctions()) {
      const fnName = fn.getName();
      if (!fnName) continue;

      const calls = fn
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .map((call) => {
          const symbol = call.getExpression().getSymbol();
          if (!symbol) return null;
          return resolveFullSymbolName(symbol);
        })
        .filter(Boolean);

      chunks.push({
        symbol: fnName,
        filePath,
        type: "function",
        lineRange: [fn.getStartLineNumber(), fn.getEndLineNumber()],
        calls,
        content: `
Symbol: ${fnName}
File: ${filePath}
Type: Function

Code:
${fn.getText()}
        `.trim(),
      });
    }
  }

  return chunks;
}

function resolveFullSymbolName(symbol: any): string | null {
  const decl = symbol.getDeclarations()?.[0];
  if (!decl) return null;

  const sourceFile = decl.getSourceFile();
  const filePath = sourceFile.getFilePath();

  if (filePath.includes("node_modules")) return null;

  const name = symbol.getName();

  const parent = decl.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
  if (parent) {
    const className = parent.getName();
    if (className) return `${className}.${name}`;
  }

  return name;
}

