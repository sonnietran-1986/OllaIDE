import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";
import { AppConfig } from '../components/Config';

export async function generateChatResponse(
  prompt: string, 
  config: AppConfig,
  images?: {mimeType: string, data: string}[]
) {
  const tools: any[] = [];
  if (config.enableWebSearch) tools.push({ googleSearch: {} });
  if (config.enableCodeExecution) tools.push({ codeExecution: {} });
  if (config.enableUrlContext) tools.push({ urlContext: {} });

  const thinkingLevelMap = {
    'MINIMAL': ThinkingLevel.MINIMAL,
    'LOW': ThinkingLevel.LOW,
    'HIGH': ThinkingLevel.HIGH,
  };
  let thinkingConfig = config.thinkingLevel ? { thinkingLevel: thinkingLevelMap[config.thinkingLevel] } : undefined;

  let modelsToTry = [...new Set([config.selectedModel, ...config.models])];

  if (prompt.startsWith('/code')) {
    // Force high thinking and prioritize pro model for code
    thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    prompt = prompt.replace('/code', '').trim();
    modelsToTry = [...new Set(["gemini-3.1-pro-preview", ...modelsToTry])];
  }

  const parts: any[] = [];
  
  if (images && images.length > 0) {
    images.forEach(img => {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data
        }
      });
    });
  }
  
  parts.push({ text: prompt });

  const selectedKey = config.apiKeys.find(ak => ak.name === config.selectedApiKeyName);
  const keysToTry = selectedKey 
    ? [selectedKey.key, ...config.apiKeys.filter(ak => ak.name !== config.selectedApiKeyName).map(ak => ak.key)] 
    : config.apiKeys.map(ak => ak.key);

  if (keysToTry.length === 0) {
    keysToTry.push(process.env.GEMINI_API_KEY || "");
  }

  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    for (const currentKey of keysToTry) {
      if (!currentKey) continue;
      
      try {
        const ai = new GoogleGenAI({ apiKey: currentKey });
        
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: { parts },
          config: {
            systemInstruction: config.systemPrompt,
            tools: tools.length > 0 ? tools : undefined,
            thinkingConfig: thinkingConfig,
          }
        });
        
        return response;
      } catch (error: any) {
        lastError = error;
        const errMsg = error?.message?.toLowerCase() || "";
        const status = error?.status || error?.response?.status;
        
        const isQuotaError = 
          status === 429 || 
          errMsg.includes("quota") || 
          errMsg.includes("rate limit") || 
          errMsg.includes("too many requests") ||
          errMsg.includes("exhausted");
          
        const isAuthError = status === 401 || status === 403 || errMsg.includes("api key not valid");

        if (isQuotaError || isAuthError) {
          console.warn(`[OllaIDE] Key failed (Quota/Auth). Trying next key... (Model: ${currentModel})`);
          continue; // Try next key
        } else {
          console.warn(`[OllaIDE] Request failed with model ${currentModel}. Error: ${errMsg}. Trying next model...`);
          break; // Break key loop, try next model
        }
      }
    }
  }

  throw lastError || new Error("All models and keys failed.");
}
