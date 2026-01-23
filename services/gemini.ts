
import { GoogleGenAI } from "@google/genai";
import { File, Settings, Message } from "../types";

interface Attachment {
    type: 'image' | 'file';
    content: string;
    name: string;
}

export const generateCode = async (
  prompt: string,
  currentFiles: File[],
  settings: Settings,
  attachments: Attachment[] = [], 
  history: Message[] = [], 
  isSafeMode: boolean = true,
  signal?: AbortSignal
): Promise<{ text: string; files: Record<string, string> }> => {
  
  // Priority: User's BYOK Key -> Netlify Env API_KEY -> System Variable
  const apiKey = (settings.googleApiKey && settings.googleApiKey.trim().length > 10) 
    ? settings.googleApiKey.trim() 
    : (process.env.API_KEY || process.env.VITE_API_KEY || '');

  if (!apiKey) {
      throw new Error("Gemini API Key missing. Please set it in Netlify Env or App Settings.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const fileContext = currentFiles.length > 0 
    ? currentFiles.map(f => `--- FILE: ${f.name} ---\n${f.content}`).join('\n\n')
    : "Empty project.";

  const SYSTEM_INSTRUCTION = `
You are "MYSELF IDE AI Architect", a world-class senior developer.
Generate a complete, professional web application based on the user's settings.

### ARCHITECTURE RULES:
1. **ADMIN PANEL (${settings.enableAdminPanel ? 'ENABLED' : 'DISABLED'}):**
   - If ENABLED, you MUST create a separate file named **"admin.html"**.
   - "admin.html" must be a self-contained, high-end dashboard (include its own <style> and <script>).
   - **CRITICAL:** Do NOT put any admin buttons, login links for admin, or admin UI elements inside "index.html". Keep the user site clean and realistic.
2. **SEO (${settings.enableSEO ? 'ENABLED' : 'DISABLED'}):**
   - If ENABLED, generate meta tags in "index.html".
   - ALSO generate **"sitemap.xml"** and **"robots.txt"** files.
3. **PWA (${settings.enablePWA ? 'ENABLED' : 'DISABLED'}):**
   - If ENABLED, generate **"manifest.json"** and **"sw.js"**. Register sw.js in "index.html".
4. **FIREBASE:** Use provided config if present: ${settings.firebaseConfig || 'None'}.
5. **FRAMEWORKS:** Use ${settings.enableTailwind ? 'Tailwind' : ''} ${settings.enableBootstrap ? 'Bootstrap' : ''} via CDN.

### OUTPUT EXPECTATIONS:
- Always return COMPLETE files. No placeholders.
- Response must be a valid JSON object.
- Explain what was created in the "message" field.

### JSON RESPONSE FORMAT:
{
  "message": "Summary...",
  "files": [
    { "name": "index.html", "content": "..." },
    { "name": "style.css", "content": "..." },
    { "name": "script.js", "content": "..." },
    { "name": "admin.html", "content": "..." },
    { "name": "sitemap.xml", "content": "..." },
    { "name": "robots.txt", "content": "..." }
  ]
}
`;

  const selectedModel = settings.selectedModel || 'gemini-3-pro-preview';

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: { parts: [{ text: `[CONTEXT]\n${fileContext}\n\n[USER REQUEST]\n"${prompt}"` }] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: selectedModel.includes('pro') ? 4000 : 0 }
      }
    });

    if (!response.text) throw new Error("AI returned no content.");

    const result = JSON.parse(response.text);
    const modifications: Record<string, string> = {};
    
    if (result.files && Array.isArray(result.files)) {
        result.files.forEach((f: any) => {
            if (f.name && typeof f.content === 'string') {
                modifications[f.name] = f.content;
            }
        });
    }

    return {
      text: result.message || "Updated successfully.",
      files: modifications
    };
  } catch (err: any) {
    console.error("Gemini Error:", err);
    throw new Error(`AI Architecture Error: ${err.message}`);
  }
};
