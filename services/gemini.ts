import { GoogleGenAI } from "@google/genai";
import { File, Settings, Message } from "../types";

// Interface for Attachment
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
  
  // 1. VALIDATE API KEY
  const apiKey = settings.googleApiKey && settings.googleApiKey.trim().length > 10
      ? settings.googleApiKey 
      : process.env.API_KEY;

  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      throw new Error("API Key is missing. Please add your Key in Settings.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  // 2. PREPARE FILE CONTEXT
  // We pass the current state of files so the AI knows what to update.
  const fileContext = currentFiles.map((f, index) => `
[[FILE_START: ${f.name}]]
${f.content}
[[FILE_END: ${f.name}]]
`).join('\n\n');

  // 3. FEATURE MANIFEST (CRITICAL UPDATE)
  // We build a strict list of what is allowed and what is NOT allowed.
  const activeFeatures = [];
  const constraints = [];

  if (settings.enableFirebaseRules) {
      activeFeatures.push("FIREBASE_REALTIME_DATABASE");
      constraints.push("Generate 'database.rules.json' for security.");
  } else {
      constraints.push("DO NOT generate 'database.rules.json'.");
  }

  if (settings.enableAdminPanel) {
      activeFeatures.push("ADMIN_PANEL");
      constraints.push("Generate/Update 'admin.html'. Include CRUD operations.");
  } else {
      constraints.push("DO NOT generate 'admin.html'. DO NOT include admin logic.");
  }

  if (settings.enablePWA) {
      activeFeatures.push("PWA_SUPPORT");
      constraints.push("Generate 'manifest.json' and 'sw.js'.");
  }

  if (settings.enableTailwind) activeFeatures.push("TAILWIND_CSS");
  if (settings.enableBootstrap) activeFeatures.push("BOOTSTRAP_5");
  
  // Secure Mode Logic (Split vs Combined)
  if (settings.enableSecureMode) {
      constraints.push("STRICT FILE SEPARATION: Keep HTML in .html, CSS in .css, JS in .js.");
      constraints.push("Link files using <link rel='stylesheet'> and <script src='...'>.");
  }

  // Firebase Config Injection
  let firebaseInstruction = "";
  if (settings.firebaseConfig && settings.firebaseConfig.length > 20) {
      firebaseInstruction = `
      IMPORTANT: When using Firebase, you MUST use exactly this configuration:
      ${settings.firebaseConfig}
      `;
  }

  // 4. SYSTEM INSTRUCTION (THE BRAIN)
  let SYSTEM_INSTRUCTION = `
You are an expert Senior Web Developer & AI Architect.

### YOUR PROCESS:
1. **ANALYZE:** Check 'ACTIVE_FEATURES' below. Only implement features that are listed.
2. **CONTEXT:** Read the [[EXISTING FILES]].
3. **DECIDE:** 
   - If the user asks for a specific change (e.g., "change button color"), ONLY return the file that needs changing (e.g., 'style.css').
   - If the user asks for a new feature, generate all necessary files.
4. **OUTPUT:** Return a SINGLE valid JSON object.

### ACTIVE FEATURES (ENABLED BY USER):
[ ${activeFeatures.join(', ')} ]

### STRICT CONSTRAINTS:
${constraints.map(c => `- ${c}`).join('\n')}
- **DEPLOYMENT FIX:** If the user asks about deployment or Netlify, ensure a '_redirects' file exists with content '/* /index.html 200'.

${firebaseInstruction}

### ERROR HANDLING:
- In JavaScript, use try/catch blocks for all Database/API calls.
- If an error occurs, use \`alert()\` or \`console.error\` to notify the user in the preview.

### JSON OUTPUT FORMAT:
Return ONLY this JSON structure. No Markdown. No Chat.
{
  "message": "Short description of what you did...",
  "files": [
    { 
      "name": "filename.ext", 
      "content": "Full file content here..." 
    }
  ]
}
`;

  // 5. BUILD THE PROMPT
  let userPrompt = `
    === EXISTING PROJECT FILES ===
    ${fileContext || "No files yet. Starting fresh."}

    === USER REQUEST ===
    "${prompt}"

    === TASK ===
    1. Update the code based on the Request and Active Features.
    2. If a feature (like Admin Panel) is NOT in Active Features, ignore it even if the user asks, or explain why.
    3. Return valid JSON.
  `;

  // Handle Attachments
  if (attachments && attachments.length > 0) {
      userPrompt += `\n\n=== ATTACHMENTS ===`;
      attachments.forEach((att, index) => {
          if (att.type === 'file') {
              userPrompt += `\n[FILE ${index+1}: ${att.name}]\n${att.content}\n`;
          } else if (att.type === 'image') {
              userPrompt += `\n[IMAGE ${index+1}]: ${att.content}`;
          }
      });
  }

  const textPart = { text: userPrompt };
  const parts: any[] = [textPart];

  // 6. CALL API (With Retry Logic)
  let modelName = settings.selectedModel || 'gemini-3-flash-preview';
  let attempt = 0;
  const maxRetries = 2; 

  while (attempt <= maxRetries) {
    try {
        if (signal?.aborted) throw new Error("Aborted");
        console.log(`[Gemini] Attempt ${attempt + 1}: Using ${modelName}`);

        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: parts },
            config: { 
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.5,
                responseMimeType: "application/json",
                maxOutputTokens: 8192
            }
        });

        if (signal?.aborted) throw new Error("Aborted");

        const rawText = response.text || "";
        return parseResponse(rawText);

    } catch (error: any) {
        if (error.message === "Aborted" || signal?.aborted) throw new Error("Generation stopped by user.");
        console.warn(`Attempt ${attempt + 1} failed:`, error);
        
        // Fallback Strategy
        if (attempt === maxRetries) throw new Error("AI Generation failed. Please try again.");
        if (modelName.includes('gemini-3')) modelName = 'gemini-2.0-flash';
        else modelName = 'gemini-1.5-flash';
        
        attempt++;
        await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  throw new Error("Unknown error.");
};

// --- ROBUST JSON PARSER WITH AUTO-REPAIR ---
function parseResponse(text: string): { text: string; files: Record<string, string> } {
  const modifications: Record<string, string> = {};
  let cleanText = "Code updated successfully.";

  // 1. Remove Markdown if present
  let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
      // 2. Locate JSON boundaries
      const startIndex = jsonString.indexOf('{');
      if (startIndex === -1) throw new Error("No JSON object found");
      
      if (startIndex > 0) jsonString = jsonString.substring(startIndex);

      // 3. Attempt Parse
      let parsed;
      try {
          parsed = JSON.parse(jsonString);
      } catch (e) {
          // 4. Auto-Repair Truncated JSON
          console.warn("Initial parse failed. Attempting auto-repair...");
          
          const repairs = ['"}', '"}]}', '}]}', ']}', '}'];
          let repaired = false;
          for (const closer of repairs) {
              try {
                  parsed = JSON.parse(jsonString + closer);
                  repaired = true;
                  break; 
              } catch (err) { continue; }
          }
          
          if (!repaired) {
               // Fallback: Regex Extraction
               const filesRegex = /"name":\s*"([^"]+)",\s*"content":\s*"((?:[^"\\]|\\.)*)"/g;
               let match;
               let extractedFiles = false;
               while ((match = filesRegex.exec(jsonString)) !== null) {
                   const name = match[1];
                   let content = match[2].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                   modifications[name] = content;
                   extractedFiles = true;
               }
               if (extractedFiles) return { text: "Partial code recovered.", files: modifications };
               throw e;
          }
      }
      
      // 5. Transform to internal format
      if (parsed.files && Array.isArray(parsed.files)) {
        parsed.files.forEach((f: any) => {
          if (f.name && f.content) {
              modifications[f.name] = f.content;
          }
        });
      }
      if (parsed.message) cleanText = parsed.message;

  } catch (e) {
      console.error("JSON Parsing Failed:", text);
      return { 
          text: "⚠️ The AI response was incomplete. Please try a simpler request.", 
          files: {} 
      };
  }

  return { text: cleanText, files: modifications };
}