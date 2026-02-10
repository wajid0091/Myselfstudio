
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
  if (!apiKey) {
    throw new Error("API_KEY is missing. Please add it to your environment variables.");
  }

  const model = settings.selectedModel || 'google/gemini-2.0-flash-001';

  const fileContext = currentFiles.map(f => {
      const isMedia = f.language === 'image' || f.language === 'video';
      return `--- FILE: ${f.name} ---\n${isMedia ? '[MEDIA/IMAGE DATA]' : f.content}`;
  }).join('\n\n');

  const featureContext = `
[SETTINGS]
- Tailwind: ${settings.enableTailwind ? 'ON' : 'OFF'}
- Bootstrap: ${settings.enableBootstrap ? 'ON' : 'OFF'}
- SEO: ${settings.enableSEO ? 'ON' : 'OFF'}
`;

  const SYSTEM_INSTRUCTION = `
You are "WAI Assistant", a world-class AI developer by Wajid Ali.
Return ONLY a valid JSON object with:
"message": (string) summary of changes
"files": (array) objects with "name" and "content" (full source code).

NEVER break the existing code structure. Only modify what is needed.
`;

  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    {
      role: 'user',
      content: `[CONTEXT]\n${featureContext}\n\n[FILES]\n${fileContext}\n\n[REQUEST]\n${prompt}`
    }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://myselfide.online",
        "X-Title": "MYSELF IDE",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.4
      }),
      signal
    });

    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message || "OpenRouter Error");
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
      text: result.message || "WAI Engine has updated your files.",
      files: modifications
    };
  } catch (err: any) {
    console.error("OpenRouter API Error:", err);
    throw new Error(err.message || "Failed to connect to AI engine.");
  }
};
