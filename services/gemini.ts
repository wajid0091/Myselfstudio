
import { GoogleGenAI, Type } from "@google/genai";
import { File, Settings, Message, AIModel } from "../types";

// --- SYSTEM INSTRUCTION ---
const SYSTEM_INSTRUCTION = `
You are "WAI Assistant" (Wajid Ali AI Architect), the most advanced AI developer.
Your goal is to provide full, functional code updates based on user requests.

CRITICAL RULES:
1. ALWAYS return a valid JSON object.
2. Provide the FULL content of any file you modify.
3. Maintain the professional coding standards of Wajid Ali's IDE.
4. MEMORY & CONTEXT: You must remember previous user messages and project state. If the user refers to "it" or "that", look at the history.
5. FEATURES IMPLICIT GENERATION:
   - If "PWA" is enabled or requested, YOU MUST generate "manifest.json" and "sw.js".
   - If "SEO" is enabled, YOU MUST generate "robots.txt" and "sitemap.xml".
   - If "Admin Panel" is enabled, YOU MUST generate "admin.html" and "admin.js" with a functional dashboard UI.
   - If "Firebase Rules" is enabled, YOU MUST generate "firestore.rules".

RESPONSE FORMAT (JSON ONLY):
{
  "message": "Summary of changes",
  "files": [
    { "name": "filename.ext", "content": "full source code" }
  ]
}
`;

// --- HELPER: GET NATIVE KEYS ---
const getNativeGeminiKeys = () => {
  const keys: string[] = [];
  const mainKeys = process.env.API_KEY || "";
  if (mainKeys) {
    keys.push(...mainKeys.split(',').map(k => k.trim()).filter(k => k));
  }
  if (process.env.API_KEY_1) keys.push(process.env.API_KEY_1.trim());
  if (process.env.API_KEY_2) keys.push(process.env.API_KEY_2.trim());
  if (process.env.API_KEY_3) keys.push(process.env.API_KEY_3.trim());
  if (process.env.API_KEY_4) keys.push(process.env.API_KEY_4.trim());
  return [...new Set(keys)].filter(k => k && k.length > 10);
};

// --- CORE GENERATOR ---
export const generateCode = async (
  prompt: string,
  currentFiles: File[],
  settings: Settings,
  adminModels: AIModel[], 
  history: Message[] = [], 
  isSafeMode: boolean = true
): Promise<{ text: string; files: Record<string, string> }> => {

  // 1. Prepare File Context
  const fileContext = currentFiles.map(f => {
      const isMedia = f.language === 'image' || f.language === 'video';
      return `--- FILE: ${f.name} ---\n${isMedia ? '[MEDIA/IMAGE DATA]' : f.content}`;
  }).join('\n\n');

  // 2. Prepare Feature Context (Force Model Awareness)
  const featureContext = `
[PROJECT CONFIGURATION]
- Tailwind CSS: ${settings.enableTailwind ? 'ENABLED' : 'DISABLED'}
- Bootstrap 5: ${settings.enableBootstrap ? 'ENABLED' : 'DISABLED'}
- SEO Optimization: ${settings.enableSEO ? 'ACTIVE (Generate robots.txt/sitemap.xml)' : 'INACTIVE'}
- PWA Support: ${settings.enablePWA ? 'ACTIVE (Generate manifest.json/sw.js)' : 'INACTIVE'}
- Admin Panel: ${settings.enableAdminPanel ? 'ACTIVE (Generate admin.html)' : 'INACTIVE'}
- Firebase Security: ${settings.enableFirebaseRules ? 'ACTIVE' : 'INACTIVE'}
`;

  // 3. Prepare Chat History Context
  // We format previous messages to help the model understand context
  const historyContext = history.map(msg => {
      return `[${msg.role === 'user' ? 'USER' : 'AI MODEL'}]: ${msg.content}`;
  }).join('\n\n');

  const fullPrompt = `
[SYSTEM INSTRUCTION]
${SYSTEM_INSTRUCTION}

[PROJECT FEATURES]
${featureContext}

[CURRENT FILE STATE]
${fileContext}

[CONVERSATION HISTORY]
${historyContext}

[CURRENT REQUEST]
${prompt}
`;

  // 4. Determine Strategy
  const selectedId = settings.selectedModelId;
  let activeModel: AIModel | undefined;

  // Check if it is a user custom model
  const userModel = settings.userGeminiModels.find(m => m.id === selectedId);
  if (userModel) {
      activeModel = userModel;
  } else {
      // Check if it is an admin model
      const adminModel = adminModels.find(m => m.id === selectedId);
      if (adminModel) {
          activeModel = adminModel;
      }
  }

  // ---------------------------------------------------------
  // STRATEGY A: OPENROUTER (Admin Configured, System Env Key)
  // ---------------------------------------------------------
  if (activeModel && activeModel.provider === 'openrouter') {
      console.log(`[WAI Engine] Using Admin OpenRouter Model: ${activeModel.name}`);
      const apiKey = process.env.OPENROUTER_API_KEY;

      if (!apiKey) throw new Error("Server Configuration Error: OpenRouter API Key not found.");

      try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": window.location.href,
                  "X-Title": "MYSELF IDE"
              },
              mode: 'cors',
              body: JSON.stringify({
                  model: activeModel.modelId,
                  messages: [
                      { role: "system", content: SYSTEM_INSTRUCTION },
                      { role: "user", content: fullPrompt }
                  ],
                  temperature: 0.3
              })
          });

          if (!response.ok) {
              const text = await response.text();
              throw new Error(`OpenRouter Error: ${text}`);
          }

          const data = await response.json();
          const rawContent = data.choices?.[0]?.message?.content;
          if (!rawContent) throw new Error("Empty response from OpenRouter");

          return parseResponse(rawContent);

      } catch (err: any) {
          console.error("[WAI Engine] OpenRouter Failed:", err);
          throw new Error(`Model Error: ${err.message}`);
      }
  }

  // ---------------------------------------------------------
  // STRATEGY B: GEMINI (Custom User Key OR Native Fallback)
  // ---------------------------------------------------------
  
  let apiKeyToUse: string | null = null;
  // STRICT DEFAULT: Gemini 3 Flash Preview
  const DEFAULT_MODEL = 'gemini-3-flash-preview';
  
  if (activeModel && activeModel.provider === 'gemini' && activeModel.apiKey) {
      console.log(`[WAI Engine] Using User Custom Gemini Key: ${activeModel.name}`);
      apiKeyToUse = activeModel.apiKey;
  } else {
      // Default Fallback
      console.log(`[WAI Engine] Using Default Native Gemini System`);
      const nativeKeys = getNativeGeminiKeys();
      if (nativeKeys.length === 0) throw new Error("No System API Keys available.");
      apiKeyToUse = "NATIVE_ROTATION"; 
  }

  // Execute Gemini Request
  const modelId = (activeModel?.modelId) || DEFAULT_MODEL;

  if (apiKeyToUse !== "NATIVE_ROTATION" && apiKeyToUse) {
      // Single Custom Key Attempt
      return await callGemini(apiKeyToUse, modelId, fullPrompt);
  } else {
      // Native Rotation Attempt
      const nativeKeys = getNativeGeminiKeys();
      let lastError;
      for (const key of nativeKeys) {
          try {
              return await callGemini(key, DEFAULT_MODEL, fullPrompt);
          } catch (e: any) {
              console.warn("Native Key failed, rotating...", e.message);
              lastError = e;
          }
      }
      throw new Error(`All System Keys Failed. Last Error: ${lastError?.message}`);
  }
};

// --- HELPER: CALL GEMINI ---
async function callGemini(apiKey: string, modelId: string, prompt: string) {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: modelId,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
            }
        }
    });
    
    return parseResponse(response.text);
}

// --- HELPER: PARSER ---
function parseResponse(rawText: string) {
    const jsonStr = rawText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    let result;
    try {
        result = JSON.parse(jsonStr);
    } catch (e) {
        // Loose parsing
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) {
            result = JSON.parse(match[0]);
        } else {
            throw new Error("AI response was not valid JSON");
        }
    }

    const modifications: Record<string, string> = {};
    if (result.files) {
        if (Array.isArray(result.files)) {
            result.files.forEach((f: any) => { modifications[f.name] = f.content; });
        } else if (typeof result.files === 'object') {
            Object.entries(result.files).forEach(([name, content]) => {
                modifications[name] = content as string;
            });
        }
    }

    return {
        text: result.message || "Code updated successfully.",
        files: modifications
    };
}
