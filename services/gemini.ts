
import { GoogleGenAI, Type } from "@google/genai";
import { File, Settings, Message } from "../types";

// Helper to aggregate all available API keys from the environment
const getApiKeys = () => {
  const keys: string[] = [];

  // 1. Check the main comma-separated list
  const mainKeys = process.env.API_KEY || "";
  if (mainKeys) {
    keys.push(...mainKeys.split(',').map(k => k.trim()).filter(k => k));
  }

  // 2. Check individual numbered keys (as requested for Netlify reliability)
  if (process.env.API_KEY_1) keys.push(process.env.API_KEY_1.trim());
  if (process.env.API_KEY_2) keys.push(process.env.API_KEY_2.trim());
  if (process.env.API_KEY_3) keys.push(process.env.API_KEY_3.trim());
  if (process.env.API_KEY_4) keys.push(process.env.API_KEY_4.trim());

  // Remove duplicates and empty strings
  return [...new Set(keys)].filter(k => k && k.length > 10);
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
    throw new Error("No valid API Keys found. Please add API_KEY, API_KEY_1, API_KEY_2 etc. to your environment variables.");
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
  // We loop through available keys. If one fails, we try the next.
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    
    try {
      console.log(`[WAI Engine] Trying Key #${i + 1}...`);
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
      console.warn(`Key #${i + 1} failed:`, err.message);
      lastError = err;
      
      // Stop rotation if it's a content safety blocking issue (usually not key related)
      if (err.message?.includes("Safety")) {
          throw new Error("Request blocked by AI Safety filters. Please modify your prompt.");
      }

      // If this was the last key, throw the error
      if (i === keys.length - 1) {
          console.error("All API keys exhausted.");
          throw new Error(`WAI Engine Failed: ${lastError?.message || "All API keys exhausted."}`);
      }
      
      // Otherwise, loop continues to next key
    }
  }

  throw new Error("Unexpected end of key rotation.");
};
