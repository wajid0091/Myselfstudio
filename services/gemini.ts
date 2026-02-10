
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
  
  const apiKey = process.env.API_KEY;
  const model = settings.selectedModel || 'google/gemini-2.0-flash-001';

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

  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    {
      role: 'user',
      content: `[CURRENT FILES]\n${fileContext}\n\n[USER REQUEST]\n${prompt}`
    }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://myselfide.online", // Optional
        "X-Title": "MYSELF IDE", // Optional
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.3
      }),
      signal
    });

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error(data.error?.message || "Failed to get response from OpenRouter.");
    }

    const content = data.choices[0].message.content;
    const result = JSON.parse(content);
    
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
    console.error("WAI Engine (OpenRouter) Error:", err);
    throw new Error(`WAI Error: ${err.message}`);
  }
};
