import React, { useState, useEffect } from 'react';
import { generateChatResponse } from './lib/gemini';
import Terminal from './components/Terminal';
import Sidebar from './components/Sidebar';
import Config, { AppConfig, defaultConfig } from './components/Config';
import { FolderOpen, Terminal as TerminalIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { selectWorkspace, readFile, writeFile, ensureDirectory, workspaceHandle } from './lib/fileSystem';

interface Session {
  id: string;
  title: string;
  updatedAt: number;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: any[];
}

export default function App() {
  const [isWorkspaceSelected, setIsWorkspaceSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Config State
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [currentView, setCurrentView] = useState<'chat' | 'config'>('chat');
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSelectWorkspace = async () => {
    setLoading(true);
    const success = await selectWorkspace();
    if (success) {
      await ensureDirectory('.ollaide');
      
      // Load config
      const configStr = await readFile('.ollaide/config.json');
      if (configStr) {
        try {
          setConfig(JSON.parse(configStr));
        } catch (e) {
          console.error("Failed to parse config", e);
        }
      } else {
        await writeFile('.ollaide/config.json', JSON.stringify(defaultConfig, null, 2));
      }

      // Load sessions
      const sessionsStr = await readFile('.ollaide/sessions.json');
      if (sessionsStr) {
        try {
          setSessions(JSON.parse(sessionsStr));
        } catch (e) {
          console.error("Failed to parse sessions", e);
        }
      } else {
        await writeFile('.ollaide/sessions.json', JSON.stringify([]));
      }

      setIsWorkspaceSelected(true);
    }
    setLoading(false);
  };

  // Load messages when session changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentSessionId) {
        setMessages([]);
        return;
      }
      const msgsStr = await readFile(`.ollaide/sessions/${currentSessionId}.json`);
      if (msgsStr) {
        try {
          setMessages(JSON.parse(msgsStr));
        } catch (e) {
          console.error("Failed to parse messages", e);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    };
    if (isWorkspaceSelected) {
      loadMessages();
    }
  }, [currentSessionId, isWorkspaceSelected]);

  const saveSessions = async (newSessions: Session[]) => {
    setSessions(newSessions);
    await writeFile('.ollaide/sessions.json', JSON.stringify(newSessions, null, 2));
  };

  const saveMessages = async (sessionId: string, newMessages: Message[]) => {
    setMessages(newMessages);
    await ensureDirectory('.ollaide/sessions');
    await writeFile(`.ollaide/sessions/${sessionId}.json`, JSON.stringify(newMessages, null, 2));
  };

  const createNewSession = async (initialTitle: string = "New Session") => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: initialTitle,
      updatedAt: Date.now()
    };
    const newSessions = [newSession, ...sessions];
    await saveSessions(newSessions);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const handleSendMessage = async (content: string, attachments: any[] = []) => {
    let sessionId = currentSessionId;
    if (!sessionId) {
      const title = content ? content.slice(0, 30) + (content.length > 30 ? "..." : "") : "New Session";
      sessionId = await createNewSession(title);
      if (!sessionId) return;
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

      const currentMsgs = [...messages, newUserMsg];
      await saveMessages(sessionId, currentMsgs);

      // Update session title and time
      const updatedSessions = sessions.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            title: messages.length === 0 ? (finalContent ? finalContent.slice(0, 40) + (finalContent.length > 40 ? "..." : "") : "New Session") : s.title,
            updatedAt: Date.now()
          };
        }
        return s;
      }).sort((a, b) => b.updatedAt - a.updatedAt);
      await saveSessions(updatedSessions);

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
      
      const aiResponse = await generateChatResponse(finalContent, config, base64Images);
      const aiText = aiResponse.text || "Sorry, I couldn't generate a response.";

      const newAiMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        content: aiText,
        timestamp: Date.now()
      };

      await saveMessages(sessionId, [...currentMsgs, newAiMsg]);

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    await writeFile('.ollaide/config.json', JSON.stringify(newConfig, null, 2));
    setCurrentView('chat');
  };

  const handleSignOut = () => {
    // In local mode, "Sign Out" just means closing the workspace
    setIsWorkspaceSelected(false);
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-blue-500 animate-spin" size={32} />
          <p className="text-gray-500 text-xs tracking-widest animate-pulse uppercase">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  if (!isWorkspaceSelected) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center font-mono p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#0d0d0d] border border-[#1a1a1a] p-10 rounded-xl shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <TerminalIcon size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tighter">OllaIDE</h1>
          <p className="text-gray-500 text-sm mb-10 leading-relaxed">
            Local-First AI Agent IDE. <br/>
            Select a folder to start coding.
          </p>
          <button
            onClick={handleSelectWorkspace}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white hover:bg-gray-100 text-black rounded-lg font-bold transition-all active:scale-[0.98]"
          >
            <FolderOpen size={18} />
            SELECT WORKSPACE FOLDER
          </button>
          <p className="mt-8 text-[10px] text-gray-700 uppercase tracking-widest">
            100% Local • No Cloud Database
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-[#0a0a0a] overflow-hidden">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={(id) => { setCurrentSessionId(id); setCurrentView('chat'); }}
        onNewSession={() => { createNewSession(); setCurrentView('chat'); }}
        onSignOut={handleSignOut}
        user={{ displayName: "Local User", email: "workspace@local", photoURL: null }}
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

