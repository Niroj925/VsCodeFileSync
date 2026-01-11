import { qdrant } from "../lib/qdrant";
export async function checkProjectExist(
  projectName: string,
  filePath?: string
) {
  const collection = await ensureProjectCollection(projectName);

  let projectRootFromPath: string | null = null;

  if (filePath) {
    projectRootFromPath = extractProjectRoot(filePath, projectName);
  }

  const must: any[] = [];

  if (projectRootFromPath) {
    must.push({
      key: "filePath",
      match: {
        text: projectRootFromPath,
      },
    });
  }

  const res = await qdrant.scroll(collection, {
    limit: 1,
    with_payload: true,
    with_vector: false,
    filter: must.length ? { must } : undefined,
  });

  if (!res.points || res.points.length === 0) {
    return { exist: false };
  }

  const payload = res.points[0].payload as any;

  return {
    exist: true,
    projectName,
    projectRoot:
      projectRootFromPath ?? extractProjectRoot(payload.filePath, projectName),
  };
}

function extractProjectRoot(filePath: string, projectName: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const parts = normalized.split("/");

  const index = parts.lastIndexOf(projectName);
  if (index === -1) {
    throw new Error("file not found");
  }

  return parts.slice(0, index + 1).join("/");
}
async function ensureProjectCollection(projectName: string) {
  const name = projectName.trim().toLowerCase();

  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === name);

  if (!exists) {
    await qdrant.createCollection(name, {
      vectors: {
        size: 1536,
        distance: "Cosine",
      },
    });
  }

  return name;
}
