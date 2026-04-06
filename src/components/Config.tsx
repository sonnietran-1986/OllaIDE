import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

export interface ApiKey { name: string; key: string; }

export interface AppConfig {
  apiKeys: ApiKey[];
  selectedApiKeyName: string;
  systemPrompt: string;
  selectedModel: string;
  models: string[];
  enableWebSearch: boolean;
  enableCodeExecution: boolean;
  enableUrlContext: boolean;
  thinkingLevel: 'MINIMAL' | 'LOW' | 'HIGH';
}

export const defaultConfig: AppConfig = {
  apiKeys: [],
  selectedApiKeyName: '',
  systemPrompt: 'Bạn là OllaIDE AI Agent, một trợ lý lập trình thông minh với phong cách tối giản, chuyên nghiệp và thân thiện. Bạn trả lời bằng tiếng Việt, súc tích và tập trung vào giải pháp kỹ thuật.',
  selectedModel: 'gemini-3-flash-preview',
  models: ['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite-preview'],
  enableWebSearch: true,
  enableCodeExecution: true,
  enableUrlContext: true,
  thinkingLevel: 'HIGH',
};

interface ConfigProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  onBack: () => void;
}

export default function Config({ config, onSave, onBack }: ConfigProps) {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [newModel, setNewModel] = useState('');

  const handleChange = (key: keyof AppConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleAddModel = () => {
    if (newModel && !localConfig.models.includes(newModel)) {
      handleChange('models', [...localConfig.models, newModel]);
      setNewModel('');
    }
  };

  const handleRemoveModel = (model: string) => {
    handleChange('models', localConfig.models.filter(m => m !== model));
    if (localConfig.selectedModel === model) {
      handleChange('selectedModel', localConfig.models[0] || '');
    }
  };

  const handleSave = () => {
    onSave(localConfig);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0a0a0a] text-gray-200 font-mono p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold">Settings</h2>
          <div className="flex-1" />
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded font-bold text-sm hover:bg-gray-200 transition-colors">
            <Save size={16} />
            Save Changes
          </button>
        </div>

        <div className="space-y-6">
          {/* API Key */}
          <div className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden p-4">
            <label className="block text-sm font-bold mb-3">API Keys</label>
            <div className="space-y-2 mb-4">
              {localConfig.apiKeys.map((ak, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] p-2 rounded text-sm">
                  <input 
                    type="radio" 
                    checked={localConfig.selectedApiKeyName === ak.name}
                    onChange={() => handleChange('selectedApiKeyName', ak.name)}
                  />
                  <span className="flex-1 truncate">{ak.name}</span>
                  <button onClick={() => handleChange('apiKeys', localConfig.apiKeys.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Name" className="w-1/3 bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm" id="newKeyName" />
              <input type="password" placeholder="Key" className="flex-1 bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm" id="newKeyValue" />
              <button onClick={() => {
                const name = (document.getElementById('newKeyName') as HTMLInputElement).value;
                const key = (document.getElementById('newKeyValue') as HTMLInputElement).value;
                if (name && key) {
                  handleChange('apiKeys', [...localConfig.apiKeys, { name, key }]);
                  (document.getElementById('newKeyName') as HTMLInputElement).value = '';
                  (document.getElementById('newKeyValue') as HTMLInputElement).value = '';
                }
              }} className="px-3 bg-[#222] hover:bg-[#333] rounded border border-[#444] transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Prompt */}
          <div className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden p-4">
            <label className="block text-sm font-bold mb-1">System Prompt</label>
            <p className="text-xs text-gray-500 mb-3">Instructions for the AI Agent.</p>
            <textarea 
              value={localConfig.systemPrompt}
              onChange={(e) => handleChange('systemPrompt', e.target.value)}
              rows={4}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm focus:border-blue-500 outline-none resize-y"
            />
          </div>

          {/* Models */}
          <div className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#222]">
              <label className="block text-sm font-bold mb-1">Selected Model</label>
              <select 
                value={localConfig.selectedModel}
                onChange={(e) => handleChange('selectedModel', e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm focus:border-blue-500 outline-none"
              >
                {localConfig.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="p-4">
              <label className="block text-sm font-bold mb-3">Model List</label>
              <div className="space-y-2 mb-4">
                {localConfig.models.map(m => (
                  <div key={m} className="flex items-center justify-between bg-[#0a0a0a] border border-[#333] p-2 rounded text-sm">
                    <span>{m}</span>
                    <button onClick={() => handleRemoveModel(m)} className="text-red-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="Add new model..."
                  className="flex-1 bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm focus:border-blue-500 outline-none"
                />
                <button onClick={handleAddModel} className="px-3 bg-[#222] hover:bg-[#333] rounded border border-[#444] transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-4">
              <label className="block text-sm font-bold mb-1">Thinking Level</label>
              <select 
                value={localConfig.thinkingLevel}
                onChange={(e) => handleChange('thinkingLevel', e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-2 text-sm focus:border-blue-500 outline-none"
              >
                <option value="MINIMAL">Minimal</option>
                <option value="LOW">Low</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <ToggleRow 
              label="Web Search" 
              description="Enable Google Search grounding for up-to-date information."
              checked={localConfig.enableWebSearch}
              onChange={(v) => handleChange('enableWebSearch', v)}
            />
            <ToggleRow 
              label="Code Execution" 
              description="Allow the model to run Python code to solve problems."
              checked={localConfig.enableCodeExecution}
              onChange={(v) => handleChange('enableCodeExecution', v)}
            />
            <ToggleRow 
              label="URL Context" 
              description="Allow the model to read content from provided URLs."
              checked={localConfig.enableUrlContext}
              onChange={(v) => handleChange('enableUrlContext', v)}
              isLast
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange, isLast = false }: { label: string, description: string, checked: boolean, onChange: (v: boolean) => void, isLast?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-4 ${!isLast ? 'border-b border-[#222]' : ''}`}>
      <div>
        <div className="text-sm font-bold">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-white' : 'bg-[#333]'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
