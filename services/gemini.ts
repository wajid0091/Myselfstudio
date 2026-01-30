
import { GoogleGenAI, Type } from "@google/genai";
import { File, Settings, Message } from "../types";

export const generateCode = async (
  prompt: string,
  currentFiles: File[],
  settings: Settings,
  attachments: any[] = [], 
  history: Message[] = [], 
  isSafeMode: boolean = true,
  signal?: AbortSignal
): Promise<{ text: string; files: Record<string, string> }> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const fileContext = currentFiles.map(f => {
      const isMedia = f.language === 'image' || f.language === 'video';
      return `--- FILE: ${f.name} ---\n${isMedia ? '[MEDIA/IMAGE DATA]' : f.content}`;
  }).join('\n\n');

  const featureContext = `
[CRITICAL PROJECT SETTINGS]
- Use Tailwind CSS: ${settings.enableTailwind ? 'YES' : 'NO'}
- Use Bootstrap: ${settings.enableBootstrap ? 'YES' : 'NO'}
- SEO Optimization: ${settings.enableSEO ? 'ACTIVE' : 'INACTIVE'}
`;

  const SYSTEM_INSTRUCTION = `
You are "WAI Assistant" (Wajid AI Architect), a world-class senior engineer.

### CORE OPERATING PRINCIPLES:
1. **INTEGRITY SAFEGUARD:** NEVER ruin or break the existing website structure. Only modify files that require updates based on the user's specific request.
2. **INCREMENTAL UPDATES:** Preserve the user's hard work. If they ask for a button, add a button; don't rebuild the entire page unless requested.
3. **WAI BRANDING:** You are part of the Wajid Ali IDE ecosystem.
4. **FEATURE ADHERENCE:** Use the active features (Tailwind/Bootstrap) specified in settings.

### WORKSPACE CONTEXT:
${featureContext}

### RESPONSE FORMAT (STRICT JSON ONLY):
{
  "message": "Explain your changes concisely.",
  "files": [ { "name": "filename.ext", "content": "full updated source code" } ]
}
`;

  const contents = [
    ...history.slice(-8).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
    {
      role: 'user',
      parts: [
        { text: `[CURRENT FILES]\n${fileContext}` },
        { text: `[USER REQUEST]\n${prompt}` }
      ]
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: settings.selectedModel || 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
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
            },
          },
          required: ["message", "files"],
        }
      }
    });

    if (!response.text) throw new Error("Empty response from WAI Engine.");

    const result = JSON.parse(response.text);
    const modifications: Record<string, string> = {};
    if (result.files) {
        result.files.forEach((f: any) => { 
            modifications[f.name] = f.content; 
        });
    }

    return {
      text: result.message || "Changes applied by WAI Assistant.",
      files: modifications
    };
  } catch (err: any) {
    console.error("WAI Engine Error:", err);
    throw new Error(`WAI Error: ${err.message}`);
  }
};
