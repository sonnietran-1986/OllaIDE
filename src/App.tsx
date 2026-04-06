import React, { useState, useEffect } from 'react';
import { generateChatResponse } from './lib/gemini';
import Terminal from './components/Terminal';
import Sidebar from './components/Sidebar';
import Config, { AppConfig, defaultConfig } from './components/Config';
import { Loader2 } from 'lucide-react';
import { selectWorkspace, readFile, writeFile, ensureDirectory, workspaceHandle } from './lib/fileSystem';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: any[];
}

export default function App() {
  const [isWorkspaceSelected, setIsWorkspaceSelected] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [currentView, setCurrentView] = useState<'chat' | 'config'>('chat');
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSelectWorkspace = async () => {
    setLoading(true);
    const success = await selectWorkspace();
    if (success && workspaceHandle) {
      setWorkspaceName(workspaceHandle.name);
      await ensureDirectory('.ollaide');
      
      let loadedConfig = defaultConfig;
      const configStr = await readFile('.ollaide/config.json');
      if (configStr) {
        try { loadedConfig = JSON.parse(configStr); } catch (e) {}
      } else {
        await writeFile('.ollaide/config.json', JSON.stringify(defaultConfig, null, 2));
      }
      setConfig(loadedConfig);

      let loadedMessages: Message[] = [];
      const msgsStr = await readFile('.ollaide/messages.json');
      if (msgsStr) {
        try { loadedMessages = JSON.parse(msgsStr); } catch (e) {}
      } else {
        await writeFile('.ollaide/messages.json', JSON.stringify([]));
      }
      setMessages(loadedMessages);

      setIsWorkspaceSelected(true);
      setLoading(false);
      return { loadedConfig, loadedMessages };
    }
    setLoading(false);
    return null;
  };

  const handleSendMessage = async (content: string, attachments: any[] = []) => {
    let currentMsgs = messages;
    let currentConfig = config;

    if (!isWorkspaceSelected) {
      const result = await handleSelectWorkspace();
      if (!result) return; // User cancelled
      currentMsgs = result.loadedMessages;
      currentConfig = result.loadedConfig;
    }

    try {
      let finalContent = content;
      const textAttachments = attachments.filter(a => a.type === 'text' && a.textContent);
      if (textAttachments.length > 0) {
        finalContent += '\n\n' + textAttachments.map(a => `--- ${a.name} ---\n${a.textContent}`).join('\n\n');
      }

      const newUserMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: finalContent,
        attachments: attachments.map(a => ({ id: a.id, type: a.type, name: a.name })),
        timestamp: Date.now()
      };

      const updatedMsgs = [...currentMsgs, newUserMsg];
      setMessages(updatedMsgs);
      await writeFile('.ollaide/messages.json', JSON.stringify(updatedMsgs, null, 2));

      const imageAttachments = attachments.filter(a => a.type === 'image' && a.file);
      const base64Images = await Promise.all(imageAttachments.map(async (a) => {
        return new Promise<{mimeType: string, data: string}>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({ mimeType: a.file.type, data: base64 });
          };
          reader.readAsDataURL(a.file);
        });
      }));

      setIsAiLoading(true);
      
      const aiResponse = await generateChatResponse(finalContent, currentConfig, base64Images);
      const aiText = aiResponse.text || "Sorry, I couldn't generate a response.";

      const newAiMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        content: aiText,
        timestamp: Date.now()
      };

      const finalMsgs = [...updatedMsgs, newAiMsg];
      setMessages(finalMsgs);
      await writeFile('.ollaide/messages.json', JSON.stringify(finalMsgs, null, 2));

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    if (isWorkspaceSelected) {
      await writeFile('.ollaide/config.json', JSON.stringify(newConfig, null, 2));
    }
    setCurrentView('chat');
  };

  const handleCloseWorkspace = () => {
    setIsWorkspaceSelected(false);
    setWorkspaceName(null);
    setMessages([]);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-blue-500 animate-spin" size={32} />
          <p className="text-gray-500 text-xs tracking-widest animate-pulse uppercase">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-[#0a0a0a] overflow-hidden">
      <Sidebar 
        workspaceName={workspaceName}
        onSelectWorkspace={handleSelectWorkspace}
        onCloseWorkspace={handleCloseWorkspace}
        onConfigClick={() => setCurrentView('config')}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
      />
      <main className="flex-1 h-full relative overflow-hidden">
        {currentView === 'chat' ? (
          <Terminal 
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isAiLoading}
            isWorkspaceSelected={isWorkspaceSelected}
          />
        ) : (
          <Config 
            config={config}
            onSave={handleSaveConfig}
            onBack={() => setCurrentView('chat')}
          />
        )}
      </main>
    </div>
  );
}

