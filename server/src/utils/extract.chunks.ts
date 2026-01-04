import { Project, SyntaxKind, Node } from "ts-morph";
import fs from "fs";
import path from "path";

type IncomingFile = {
  path: string;
  content: string;
};

type ChunkData = {
  symbol: string;
  filePath: string;
  type: "class-method" | "function" | "react-component";
  lineRange: [number, number];
  calls: string[];
  content: string;
};

export function extractChunksFromFiles(
  files: IncomingFile[],
  srcFolder: string,
  projectName: string
): ChunkData[] {
  const chunks: ChunkData[] = [];

  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99,
      module: 99,
    },
  });
console.log('files length:', files.length); 
  /* ===================== ADD FILES ===================== */
  for (const file of files) {
    const fullPath = path.join(srcFolder, file.path);
    try {
      project.createSourceFile(fullPath, file.content, {
        overwrite: true,
      });
    } catch {
      continue;
    }
  }

  /* ===================== EXTRACT CHUNKS ===================== */
  for (const sf of project.getSourceFiles()) {
    const filePath = sf.getFilePath();

    /* -------- 1. Classes & Methods (Backend) -------- */
    for (const cls of sf.getClasses()) {
      const className = cls.getName();
      if (!className) continue;

      for (const method of cls.getMethods()) {
        const calls = extractCalls(method);

        chunks.push({
          symbol: `${className}.${method.getName()}`,
          filePath,
          type: "class-method",
          lineRange: [
            method.getStartLineNumber(),
            method.getEndLineNumber(),
          ],
          calls,
          content: `Code:\n${method.getText()}`,
        });
      }
    }

    /* -------- 2. Function Declarations -------- */
    for (const fn of sf.getFunctions()) {
      const fnName = fn.getName();
      if (!fnName) continue;

      const calls = extractCalls(fn);

      chunks.push({
        symbol: fnName,
        filePath,
        type: "function",
        lineRange: [
          fn.getStartLineNumber(),
          fn.getEndLineNumber(),
        ],
        calls,
        content: `Code:\n${fn.getText()}`,
      });
    }

    /* -------- 3. Arrow / Const Functions (Frontend FIX) -------- */
    for (const v of sf.getVariableDeclarations()) {
      const name = v.getName();
      const initializer = v.getInitializer();

      if (!initializer) continue;

      if (
        Node.isArrowFunction(initializer) ||
        Node.isFunctionExpression(initializer)
      ) {
        const calls = extractCalls(initializer);

        const isReactComponent =
          /^[A-Z]/.test(name) &&
          initializer
            .getDescendantsOfKind(SyntaxKind.JsxElement)
            .length > 0;

        chunks.push({
          symbol: name,
          filePath,
          type: isReactComponent ? "react-component" : "function",
          lineRange: [
            initializer.getStartLineNumber(),
            initializer.getEndLineNumber(),
          ],
          calls,
          content: `Code:\n${v.getText()}`,
        });
      }
    }
  }

  /* ===================== SAVE ===================== */
  saveChunks(projectName, chunks);
  return chunks;
}

/* ===================== HELPERS ===================== */

function extractCalls(node: Node): string[] {
  return node
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .map((call) => {
      const symbol = call.getExpression().getSymbol();
      if (!symbol) return null;
      return resolveFullSymbolName(symbol);
    })
    .filter(Boolean) as string[];
}

function resolveFullSymbolName(symbol: any): string | null {
  const decl = symbol.getDeclarations()?.[0];
  if (!decl) return null;

  const sourceFile = decl.getSourceFile();
  const filePath = sourceFile.getFilePath();

  if (filePath.includes("node_modules")) return null;

  const name = symbol.getName();
  const parent = decl.getFirstAncestorByKind(
    SyntaxKind.ClassDeclaration
  );

  return parent?.getName()
    ? `${parent.getName()}.${name}`
    : name;
}

function saveChunks(projectName: string, newChunks: ChunkData[]): void {
  const dataDir = path.join(process.cwd(), "data");
  const dataFile = path.join(dataDir, "chunks.json");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let stored: {
    projectName: string;
    chunks: ChunkData[];
  } | null = null;

  if (fs.existsSync(dataFile)) {
    try {
      stored = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch {
      stored = null;
    }
  }

  /**
   * 🚨 DIFFERENT PROJECT → RESET EVERYTHING
   */
  if (!stored || stored.projectName !== projectName) {
    fs.writeFileSync(
      dataFile,
      JSON.stringify(
        {
          projectName,
          chunks: newChunks,
        },
        null,
        2
      ),
      "utf8"
    );
    return;
  }

  /**
   * ✅ SAME PROJECT → UPSERT
   */
  for (const chunk of newChunks) {
    const index = stored.chunks.findIndex(
      (c) =>
        c.symbol === chunk.symbol &&
        c.filePath === chunk.filePath
    );

    if (index !== -1) {
      stored.chunks[index] = chunk;
    } else {
      stored.chunks.push(chunk);
    }
  }

  fs.writeFileSync(
    dataFile,
    JSON.stringify(stored, null, 2),
    "utf8"
  );
}


