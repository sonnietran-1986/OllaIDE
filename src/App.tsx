import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, OperationType, handleFirestoreError } from './lib/firebase';
import { generateChatResponse } from './lib/gemini';
import Terminal from './components/Terminal';
import Sidebar from './components/Sidebar';
import Config, { AppConfig, defaultConfig } from './components/Config';
import { LogIn, Terminal as TerminalIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Session {
  id: string;
  title: string;
  updatedAt: any;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: any;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Config State
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('ollaide_config');
    return saved ? JSON.parse(saved) : defaultConfig;
  });
  const [currentView, setCurrentView] = useState<'chat' | 'config'>('chat');
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Ensure user doc exists
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });
        } else {
          await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sessions Listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];
      setSessions(sessionList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sessions'));
    return () => unsubscribe();
  }, [user]);

  // Messages Listener
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, `sessions/${currentSessionId}/messages`),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messageList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `sessions/${currentSessionId}/messages`));
    return () => unsubscribe();
  }, [currentSessionId]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentSessionId(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const createNewSession = async (initialTitle: string = "New Session") => {
    if (!user) return null;
    try {
      const docRef = await addDoc(collection(db, 'sessions'), {
        userId: user.uid,
        title: initialTitle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setCurrentSessionId(docRef.id);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sessions');
      return null;
    }
  };

  const handleSendMessage = async (content: string, attachments: any[] = []) => {
    if (!user) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      const title = content ? content.slice(0, 30) + (content.length > 30 ? "..." : "") : "New Session";
      sessionId = await createNewSession(title);
      if (!sessionId) return;
    }

    try {
      // Process text attachments to append to content
      let finalContent = content;
      const textAttachments = attachments.filter(a => a.type === 'text' && a.textContent);
      if (textAttachments.length > 0) {
        finalContent += '\n\n' + textAttachments.map(a => `--- ${a.name} ---\n${a.textContent}`).join('\n\n');
      }

      // Add user message
      await addDoc(collection(db, `sessions/${sessionId}/messages`), {
        sessionId,
        role: 'user',
        content: finalContent,
        attachments: attachments.map(a => ({ id: a.id, type: a.type, name: a.name })), // Store metadata only for now
        timestamp: serverTimestamp()
      });

      // Update session title if it's the first message
      if (messages.length === 0) {
        const title = finalContent ? finalContent.slice(0, 40) + (finalContent.length > 40 ? "..." : "") : "New Session";
        await setDoc(doc(db, 'sessions', sessionId), { 
          title,
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } else {
        await setDoc(doc(db, 'sessions', sessionId), { updatedAt: serverTimestamp() }, { merge: true });
      }

      // Process image attachments
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
      
      // AI Response
      const aiResponse = await generateChatResponse(finalContent, config, base64Images);
      const aiText = aiResponse.text || "Sorry, I couldn't generate a response.";

      // Add AI message
      await addDoc(collection(db, `sessions/${sessionId}/messages`), {
        sessionId,
        role: 'model',
        content: aiText,
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('ollaide_config', JSON.stringify(newConfig));
    setCurrentView('chat');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-blue-500 animate-spin" size={32} />
          <p className="text-gray-500 text-xs tracking-widest animate-pulse uppercase">Initializing OllaIDE...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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
            Minimalist AI Agent IDE. <br/>
            Powered by Gemini 3.1 Pro.
          </p>
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white hover:bg-gray-100 text-black rounded-lg font-bold transition-all active:scale-[0.98]"
          >
            <LogIn size={18} />
            CONTINUE WITH GOOGLE
          </button>
          <p className="mt-8 text-[10px] text-gray-700 uppercase tracking-widest">
            Secure • Private • Fast
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
        user={user}
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

