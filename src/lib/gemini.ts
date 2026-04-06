import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel, FunctionCall } from "@google/genai";
import { AppConfig } from '../components/Config';
import { agentTools, ToolName } from './tools';
import { apiClient } from './apiClient';

export async function generateChatResponse(
  prompt: string, 
  config: AppConfig,
  images?: {mimeType: string, data: string}[],
  history?: any[] // Pass history to maintain context during agent loop
) {
  const tools: any[] = [];
  if (config.enableWebSearch) tools.push({ googleSearch: {} });
  if (config.enableCodeExecution) tools.push({ codeExecution: {} });
  if (config.enableUrlContext) tools.push({ urlContext: {} });
  
  // Add our custom agent tools
  tools.push({ functionDeclarations: agentTools });

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
  let currentContents = history ? [...history, { role: 'user', parts }] : [{ role: 'user', parts }];

  // The Agent Loop
  const MAX_ITERATIONS = 5;
  let iteration = 0;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    let response: GenerateContentResponse | null = null;
    let successfulModel = "";

    for (const currentModel of modelsToTry) {
      for (const currentKey of keysToTry) {
        if (!currentKey) continue;
        
        try {
          const ai = new GoogleGenAI({ apiKey: currentKey });
          
          response = await ai.models.generateContent({
            model: currentModel,
            contents: currentContents,
            config: {
              systemInstruction: config.systemPrompt,
              tools: tools.length > 0 ? tools : undefined,
              thinkingConfig: thinkingConfig,
            }
          });
          
          successfulModel = currentModel;
          break; // Break key loop
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
      if (response) break; // Break model loop if we got a response
    }

    if (!response) {
      throw lastError || new Error("All models and keys failed.");
    }

    // Check if the model wants to call functions
    if (response.functionCalls && response.functionCalls.length > 0) {
      // Add the model's response (including the function calls) to the history
      currentContents.push(response.candidates?.[0]?.content);

      const functionResponsesParts = await Promise.all(
        response.functionCalls.map(async (call: FunctionCall) => {
          let result;
          try {
            const args = call.args as any;
            switch (call.name as ToolName) {
              case 'view_file':
                result = await apiClient.viewFile(args);
                break;
              case 'create_file':
                result = await apiClient.createFile(args);
                break;
              case 'edit_file':
                result = await apiClient.editFile(args);
                break;
              case 'multi_edit_file':
                result = await apiClient.multiEditFile(args);
                break;
              case 'shell_exec':
                result = await apiClient.shellExec(args);
                break;
              default:
                result = { error: `Unknown function: ${call.name}` };
            }
          } catch (err: any) {
            result = { error: err.message };
          }

          return {
            functionResponse: {
              name: call.name,
              response: result
            }
          };
        })
      );

      // Add the function responses to the history
      currentContents.push({ role: 'user', parts: functionResponsesParts });
      
      // Continue the loop to let the model process the tool results
      continue;
    }

    // If no function calls, we are done
    return response;
  }

  throw new Error("Agent loop exceeded maximum iterations.");
}
