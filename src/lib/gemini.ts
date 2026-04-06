import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";
import { AppConfig } from '../components/Config';

export async function generateChatResponse(
  prompt: string, 
  config: AppConfig,
  images?: {mimeType: string, data: string}[]
) {
  const selectedKey = config.apiKeys.find(ak => ak.name === config.selectedApiKeyName);
  const apiKey = selectedKey ? selectedKey.key : (process.env.GEMINI_API_KEY || "");
  const ai = new GoogleGenAI({ apiKey });

  const tools: any[] = [];
  if (config.enableWebSearch) tools.push({ googleSearch: {} });
  if (config.enableCodeExecution) tools.push({ codeExecution: {} });
  if (config.enableUrlContext) tools.push({ urlContext: {} });

  let model = config.selectedModel;
  
  const thinkingLevelMap = {
    'MINIMAL': ThinkingLevel.MINIMAL,
    'LOW': ThinkingLevel.LOW,
    'HIGH': ThinkingLevel.HIGH,
  };
  let thinkingConfig = config.thinkingLevel ? { thinkingLevel: thinkingLevelMap[config.thinkingLevel] } : undefined;

  if (prompt.startsWith('/code')) {
    model = "gemini-3.1-pro-preview";
    // Force high thinking for code
    thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    prompt = prompt.replace('/code', '').trim();
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

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: {
      systemInstruction: config.systemPrompt,
      tools: tools.length > 0 ? tools : undefined,
      thinkingConfig: thinkingConfig,
    }
  });

  return response;
}
