import { openai } from "../lib/openai";


export async function embedQuery(query: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  return res.data[0].embedding;
}
