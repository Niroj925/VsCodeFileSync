
  
 export default function  smartMerge(oldContent: string, newContent: string): string {
    // Extract elements from new content (these are the updates)
    const newElements = extractCodeElements(newContent);

    if (newElements.length === 0) {
      // If we can't parse elements, return old content as fallback
      return oldContent;
    }

    // Create a map of new elements for quick lookup
    const newElementMap = new Map(newElements.map((el) => [el.signature, el]));

    let result = oldContent;

    // For each new element, find and replace in old content
    for (const newElement of newElements) {
      result = replaceOrInsertElement(result, newElement);
    }

    return result;
  }

  /**
   * Extract code elements with their signatures for matching
   */
  function extractCodeElements(content: string): Array<{
    signature: string;
    fullContent: string;
    name: string;
    type: string;
  }> {
    const elements: Array<any> = [];

    // Pattern definitions for different code constructs
    const patterns = [
      // Type definitions
      {
        regex: /type\s+(\w+)\s*=\s*[^;]+;/gs,
        type: "type",
        getName: (match: string) => match.match(/type\s+(\w+)/)?.[1] || "",
      },
      // Interface definitions
      {
        regex: /interface\s+(\w+)\s*\{[^}]*\}/gs,
        type: "interface",
        getName: (match: string) => match.match(/interface\s+(\w+)/)?.[1] || "",
      },
      // Const declarations (including arrow functions and variables)
      {
        regex:
          /(?:export\s+)?const\s+(\w+)\s*[=:][^;]*?(?:;|(?=\n(?:export\s+)?(?:const|function|class|interface|type)\s))/gs,
        type: "const",
        getName: (match: string) => match.match(/const\s+(\w+)/)?.[1] || "",
      },
      // Function declarations
      {
        regex:
          /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\{[^}]*\}/gs,
        type: "function",
        getName: (match: string) => match.match(/function\s+(\w+)/)?.[1] || "",
      },
      // Arrow function components/functions assigned to const
      {
        regex:
          /(?:export\s+)?const\s+(\w+)(?:\s*:\s*[^=]+)?\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^=]+)?=>\s*\{[\s\S]*?\n\};?/gs,
        type: "component",
        getName: (match: string) => match.match(/const\s+(\w+)/)?.[1] || "",
      },
      // Class declarations
      {
        regex:
          /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{[\s\S]*?\n\}/gs,
        type: "class",
        getName: (match: string) => match.match(/class\s+(\w+)/)?.[1] || "",
      },
      // Export statements
      {
        regex: /export\s*\{[^}]+\};?/gs,
        type: "export",
        getName: (match: string) => "export_" + match.replace(/\s/g, ""),
      },
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(
        new RegExp(pattern.regex.source, pattern.regex.flags)
      );

      for (const match of matches) {
        const fullContent = match[0].trim();
        const name = pattern.getName(fullContent);

        if (name && fullContent) {
          // Create a signature for matching (use name + type for uniqueness)
          const signature = `${pattern.type}:${name}`;

          elements.push({
            signature,
            fullContent,
            name,
            type: pattern.type,
          });
        }
      }
    }

    return elements;
  }

  /**
   * Replace or insert an element in the content
   */
  function replaceOrInsertElement(content: string, newElement: any): string {
    // Try to find the existing element in the content
    const existingMatch = findExistingElement(content, newElement);

    if (existingMatch) {
      // Replace the existing element
      return content.replace(existingMatch.content, newElement.fullContent);
    } else {
      // Element doesn't exist, insert it appropriately
      return insertNewElement(content, newElement);
    }
  }

  /**
   * Find existing element in content
   */
  function findExistingElement(
    content: string,
    element: any
  ): { content: string; index: number } | null {
    // Create patterns to match the element
    const searchPatterns = createSearchPatterns(element);

    for (const pattern of searchPatterns) {
      const regex = new RegExp(pattern, "gs");
      const match = regex.exec(content);

      if (match) {
        return {
          content: match[0],
          index: match.index,
        };
      }
    }

    return null;
  }

  /**
   * Create search patterns for finding existing elements
   */
  function createSearchPatterns(element: any): string[] {
    const escapedName = element.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns: string[] = [];

    switch (element.type) {
      case "type":
        patterns.push(`type\\s+${escapedName}\\s*=\\s*[^;]+;`);
        break;

      case "interface":
        patterns.push(`interface\\s+${escapedName}\\s*\\{[\\s\\S]*?\\}`);
        break;

      case "const":
        // Match various const formats
        patterns.push(
          `(?:export\\s+)?const\\s+${escapedName}\\s*[=:]\\s*[\\s\\S]*?;`
        );
        patterns.push(
          `(?:export\\s+)?const\\s+${escapedName}\\s*[=:]\\s*[\\s\\S]*?(?=\\n(?:export\\s+)?(?:const|function|class|interface|type)\\s)`
        );
        break;

      case "function":
        patterns.push(
          `(?:export\\s+)?(?:async\\s+)?function\\s+${escapedName}\\s*\\([^)]*\\)[\\s\\S]*?\\{[\\s\\S]*?\\n\\}`
        );
        break;

      case "component":
        patterns.push(
          `(?:export\\s+)?const\\s+${escapedName}(?:\\s*:\\s*[^=]+)?\\s*=\\s*(?:async\\s*)?\\([^)]*\\)[\\s\\S]*?=>\\s*\\{[\\s\\S]*?\\n\\};?`
        );
        break;

      case "class":
        patterns.push(
          `(?:export\\s+)?class\\s+${escapedName}(?:\\s+extends\\s+\\w+)?\\s*\\{[\\s\\S]*?\\n\\}`
        );
        break;

      case "export":
        patterns.push(`export\\s*\\{[^}]+\\};?`);
        break;
    }

    return patterns;
  }

  /**
   * Insert new element at appropriate location
   */
  function insertNewElement(content: string, element: any): string {
    // Determine where to insert based on element type
    let insertPosition = content.length;

    // Try to find a similar type to insert near
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Insert types and interfaces near other types/interfaces
      if (element.type === "type" || element.type === "interface") {
        if (line.startsWith("type ") || line.startsWith("interface ")) {
          // Find end of this declaration
          let j = i;
          let braceCount = 0;
          let foundBrace = false;

          while (j < lines.length) {
            const currentLine = lines[j];
            for (const char of currentLine) {
              if (char === "{") {
                braceCount++;
                foundBrace = true;
              }
              if (char === "}") braceCount--;
            }

            if (foundBrace && braceCount === 0) {
              insertPosition = lines.slice(0, j + 1).join("\n").length;
              break;
            }

            if (!foundBrace && currentLine.includes(";")) {
              insertPosition = lines.slice(0, j + 1).join("\n").length;
              break;
            }

            j++;
          }
          break;
        }
      }

      // Insert consts and functions in appropriate sections
      if (
        element.type === "const" ||
        element.type === "function" ||
        element.type === "component"
      ) {
        if (
          line.startsWith("const ") ||
          line.startsWith("export const ") ||
          line.startsWith("function ") ||
          line.startsWith("export function ")
        ) {
          // Insert after imports and types but before exports
          insertPosition = content.indexOf(line) + line.length;
        }
      }
    }

    // Insert the new element
    return (
      content.slice(0, insertPosition) +
      "\n\n" +
      element.fullContent +
      content.slice(insertPosition)
    );
  }