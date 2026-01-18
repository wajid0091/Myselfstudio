import { GoogleGenAI } from "@google/genai";
import { File, Settings } from "../types";

// NOTE: We initialize the client inside the function to handle dynamic API key updates.

const SYSTEM_INSTRUCTION = `
You are an expert Full-Stack AI Web Developer and conversational assistant.
Your goal is to help the user build web applications while maintaining a helpful, natural conversation in their preferred language (English or Urdu).

### OUTPUT RULES:

1.  **Conversation**: 
    - If the user asks a question, explains a concept, or greets you, reply naturally in text.
    - If the user speaks Urdu, reply in Urdu. If English, reply in English.

2.  **Code Generation**:
    - If the user asks to create, update, or fix code, you MUST generate the actual code files.
    - **CRITICAL**: When generating code, you must include a JSON block containing the file data.
    - The JSON block must be strictly formatted as:
      \`\`\`json
      {
        "files": [
           { "name": "filename.ext", "content": "..." }
        ]
      }
      \`\`\`
    - You can provide an explanation *before* or *after* this JSON block.

3.  **File Management**:
    - Maintain strict separation (index.html, style.css, script.js).
    - Always use modern standards (ES6+, Flexbox/Grid, Tailwind if enabled).
    - If updating a file, provide the *complete* file content, not just a diff.

4.  **Context**:
    - You have access to the current files. Use them to make intelligent updates.
`;

export const generateCode = async (
  prompt: string,
  currentFiles: File[],
  settings: Settings,
  imageBase64?: string
): Promise<{ text: string; files: Record<string, string> }> => {
  
  // Initialize AI client here to ensure we get the latest API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const fileContext = currentFiles.map(f => `
=== FILE: ${f.name} ===
${f.content}
=======================
`).join('\n');
  
  const settingsContext = `
    Active Settings:
    - Model: ${settings.selectedModel}
    - Tailwind CSS: ${settings.enableTailwind ? 'Enabled' : 'Disabled'}
    - Bootstrap 5: ${settings.enableBootstrap ? 'Enabled' : 'Disabled'}
  `;

  const textPart = {
    text: `
    ${fileContext}

    SETTINGS:
    ${settingsContext}

    USER REQUEST: "${prompt}"
    `
  };

  const parts: any[] = [textPart];

  if (imageBase64) {
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    parts.push({
      inlineData: {
        mimeType: 'image/png', 
        data: base64Data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: settings.selectedModel || 'gemini-3-flash-preview',
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // We do NOT enforce JSON MIME type here to allow for natural conversation + Code blocks
      }
    });

    const rawText = response.text || "";
    const result = parseResponse(rawText);

    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// Helper to extract JSON from the mixed response
function parseResponse(text: string): { text: string; files: Record<string, string> } {
  const jsonRegex = /```json\s*(\{[\s\S]*?\})\s*```/i;
  const match = text.match(jsonRegex);

  const modifications: Record<string, string> = {};
  let cleanText = text;

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.files && Array.isArray(parsed.files)) {
        parsed.files.forEach((f: any) => {
          if (f.name && f.content) {
            modifications[f.name] = f.content;
          }
        });
      }
      // Remove the JSON block from the display text so it doesn't look cluttered
      cleanText = text.replace(match[0], '').trim();
    } catch (e) {
      console.error("Failed to parse extracted JSON", e);
    }
  }

  return {
    text: cleanText,
    files: modifications
  };
}