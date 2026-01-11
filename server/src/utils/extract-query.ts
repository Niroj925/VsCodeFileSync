import { KeywordExtraction } from "../types";
import { openai } from "../lib/openai";

export async function extractKeywordsWithLLM(
  query: string
): Promise<KeywordExtraction> {
  const prompt = `You are a code search expert. Extract relevant keywords from this developer query.

User Query: "${query}"

Return a JSON object with:
1. "primary": Main technical terms (e.g., UI components, data structures, specific features)
2. "secondary": Supporting concepts (e.g., "format", "style", "handler")  
3. "actions": Action verbs (e.g., "change", "update", "fix", "add")
4. "codePatterns": Likely function/class/variable names in camelCase or PascalCase
   - Think about how developers name things
   - Examples: "showToast", "ToastMessage", "formatToast", "toastFormatter"

Return ONLY valid JSON, no markdown.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Faster and cheaper for this task
      messages: [
        {
          role: "system",
          content:
            "You extract keywords for code search. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("Keyword extraction error:", error);
    // Fallback to basic extraction
    return fallbackKeywordExtraction(query);
  }
}

// Fallback when LLM fails
async function fallbackKeywordExtraction(
  query: string
): Promise<KeywordExtraction> {
  const words = query.toLowerCase().split(/\s+/);
  const actionVerbs = [
    "change",
    "update",
    "modify",
    "fix",
    "add",
    "remove",
    "create",
    "delete",
    "refactor",
    "implement",
    "show",
  ];

  return {
    primary: words.filter((w) => w.length > 4 && !actionVerbs.includes(w)),
    secondary: [],
    actions: words.filter((w) => actionVerbs.includes(w)),
    codePatterns: [],
  };
}
