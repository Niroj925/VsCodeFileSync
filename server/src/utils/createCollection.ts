import { qdrant } from "../lib/qdrant";

const VECTOR_SIZE = 1536;

export type EnsureCollectionResult = {
  created: boolean;
  message: string;
};


export async function ensureCodeCollection(name:string):Promise<EnsureCollectionResult> {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === name
  );

  if(exists){
    return {message:'already exist',created:false}
  }

  if (!exists) {
    console.log(`📦 Creating Qdrant collection: ${name}`);

    await qdrant.createCollection(name, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    });
  } else {
    console.log(`✅ Qdrant collection exists: ${name}`);
  }

  return {message:'created new',created:true}
}
