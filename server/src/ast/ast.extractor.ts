import { SyntaxKind } from "ts-morph";
import { astProject } from "./ast.project";

export function extractChunks() {
  const chunks = [];

  const sourceFiles = astProject.getSourceFiles().filter(sf =>
    !sf.isDeclarationFile() &&
    !sf.getFilePath().includes("node_modules")
  );

  for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();

    for (const cls of sf.getClasses()) {
      const className = cls.getName();
      if (!className) continue;

      for (const method of cls.getMethods()) {
        const calls = method
          .getDescendantsOfKind(SyntaxKind.CallExpression)
          .map(call => call.getExpression().getSymbol()?.getName())
          .filter(Boolean) as string[];

        chunks.push({
          symbol: `${className}.${method.getName()}`,
          filePath,
          content: method.getText(),
          calls,
        });
      }
    }

    // standalone functions
    for (const fn of sf.getFunctions()) {
      chunks.push({
        symbol: fn.getName(),
        filePath,
        content: fn.getText(),
        calls: fn
          .getDescendantsOfKind(SyntaxKind.CallExpression)
          .map(c => c.getExpression().getSymbol()?.getName())
          .filter(Boolean),
      });
    }
  }

  return chunks;
}
