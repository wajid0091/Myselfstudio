
import { GoogleGenAI, Type } from "@google/genai";
import { File, Settings, Message } from "../types";

// Helper to get multiple keys from the environment variable
const getApiKeys = () => {
  const keysString = process.env.API_KEY || "";
  // Splits keys by comma, trims whitespace, and ignores empty strings
  return keysString.split(',').map(k => k.trim()).filter(k => k);
};

export const generateCode = async (
  prompt: string,
  currentFiles: File[],
  settings: Settings,
  attachments: any[] = [], 
  history: Message[] = [], 
  isSafeMode: boolean = true,
  signal?: AbortSignal
): Promise<{ text: string; files: Record<string, string> }> => {
  
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("API_KEY is missing. Please add your Gemini API Key(s) to environment variables (comma separated).");
  }

  const modelName = 'gemini-3-flash-preview'; 

  const fileContext = currentFiles.map(f => {
      const isMedia = f.language === 'image' || f.language === 'video';
      return `--- FILE: ${f.name} ---\n${isMedia ? '[MEDIA/IMAGE DATA]' : f.content}`;
  }).join('\n\n');

  const featureContext = `
[PROJECT FEATURES]
- Tailwind CSS: ${settings.enableTailwind ? 'ENABLED' : 'DISABLED'}
- Bootstrap 5: ${settings.enableBootstrap ? 'ENABLED' : 'DISABLED'}
- SEO Optimization: ${settings.enableSEO ? 'ACTIVE' : 'INACTIVE'}
`;

  const SYSTEM_INSTRUCTION = `
You are "WAI Assistant" (Wajid AI Architect), the most advanced AI developer.
Your goal is to provide full, functional code updates based on user requests.

CRITICAL RULES:
1. ALWAYS return a valid JSON object.
2. Provide the FULL content of any file you modify.
3. Maintain the professional coding standards of Wajid Ali's IDE.

RESPONSE FORMAT (JSON ONLY):
{
  "message": "Summary of changes",
  "files": [
    { "name": "filename.ext", "content": "full source code" }
  ]
}
`;

  let lastError: any = null;

  // KEY ROTATION LOGIC
  // We loop through available keys. If one fails with a quota error, we try the next.
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: 'user', parts: [{ text: `[SYSTEM]\n${SYSTEM_INSTRUCTION}\n\n[CONTEXT]\n${featureContext}\n\n[FILES]\n${fileContext}\n\n[REQUEST]\n${prompt}` }] }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING },
              files: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["name", "content"]
                }
              }
            },
            required: ["message", "files"]
          },
          temperature: 0.3,
        },
      });

      const result = JSON.parse(response.text || "{}");
      const modifications: Record<string, string> = {};
      if (result.files) {
          result.files.forEach((f: any) => { modifications[f.name] = f.content; });
      }

      return {
        text: result.message || "WAI Engine synchronized your code.",
        files: modifications
      };

    } catch (err: any) {
      console.warn(`Key ${i + 1}/${keys.length} failed:`, err.message);
      lastError = err;
      
      // If error is NOT related to quota (429) or permissions (403), throw immediately (don't rotate for bad requests)
      // However, usually we want to rotate on 429 (Too Many Requests) or 503 (Service Unavailable)
      const isQuotaError = err.message?.includes('429') || err.message?.includes('403') || err.message?.includes('503') || err.message?.includes('quota');
      
      if (!isQuotaError && i < keys.length - 1) {
          // If it's some other random network error, we might still want to try the next key just in case
          continue; 
      }
      
      if (i === keys.length - 1) {
          // All keys failed
          console.error("All API keys exhausted or failed.");
          throw new Error(`WAI Engine Failed: ${lastError?.message || "All API keys exhausted."}`);
      }
      // Otherwise, continue loop to next key
    }
  }

  throw new Error("Unexpected end of key rotation.");
};
