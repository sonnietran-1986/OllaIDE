import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal as TerminalIcon, Send, User, Bot, Loader2, ChevronRight, X, FileText, Image as ImageIcon, Video as VideoIcon, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'text';
  file?: File;
  textContent?: string;
  previewUrl?: string;
  name: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: any;
  attachments?: Attachment[];
}

interface TerminalProps {
  messages: Message[];
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  isWorkspaceSelected: boolean;
}

export default function Terminal({ messages, onSendMessage, isLoading, isWorkspaceSelected }: TerminalProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input.trim(), attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const addAttachment = (file: File, type: 'image' | 'video' | 'text') => {
    const newAttachment: Attachment = {
      id: Math.random().toString(36).substring(7),
      type,
      file,
      name: file.name,
      previewUrl: type === 'image' ? URL.createObjectURL(file) : undefined
    };
    setAttachments(prev => [...prev, newAttachment]);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let handled = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          addAttachment(file, 'image');
          handled = true;
        }
      } else if (item.type.indexOf('video') !== -1) {
        const file = item.getAsFile();
        if (file) {
          addAttachment(file, 'video');
          handled = true;
        }
      }
    }

    if (!handled) {
      const text = e.clipboardData.getData('text');
      const wordCount = text.trim().split(/\s+/).length;
      // If text is longer than 100 words, make it an attachment block
      if (wordCount > 100) {
        e.preventDefault();
        const newAttachment: Attachment = {
          id: Math.random().toString(36).substring(7),
          type: 'text',
          textContent: text,
          name: `Pasted text (${wordCount} words)`
        };
        setAttachments(prev => [...prev, newAttachment]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        addAttachment(file, 'image');
      } else if (file.type.startsWith('video/')) {
        addAttachment(file, 'video');
      } else if (file.type.startsWith('text/')) {
        addAttachment(file, 'text');
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const filtered = prev.filter(a => a.id !== id);
      const removed = prev.find(a => a.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        addAttachment(file, 'image');
      } else if (file.type.startsWith('video/')) {
        addAttachment(file, 'video');
      } else {
        addAttachment(file, 'text');
      }
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-[#e0e0e0] font-mono selection:bg-[#333] selection:text-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1a1a1a] bg-[#0d0d0d]">
        <TerminalIcon size={16} className="text-gray-500" />
        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">OllaIDE Terminal v1.0.0</span>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full opacity-20 select-none">
            <TerminalIcon size={64} className="mb-4" />
            <p className="text-sm">Ready for input...</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 group",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "flex max-w-[85%] gap-3",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded flex items-center justify-center shrink-0 border",
                  msg.role === 'user' ? "bg-[#1a1a1a] border-[#333]" : "bg-[#000] border-[#1a1a1a]"
                )}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} className="text-blue-400" />}
                </div>
                
                <div className={cn(
                  "p-3 rounded-lg text-sm leading-relaxed flex flex-col gap-2",
                  msg.role === 'user' ? "bg-[#1a1a1a] text-gray-200" : "bg-transparent border border-[#1a1a1a] text-gray-300"
                )}>
                  {/* Render Message Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-2 bg-[#222] border border-[#333] rounded p-2 max-w-[250px]">
                          {att.type === 'image' && att.previewUrl ? (
                            <img src={att.previewUrl} alt="attachment" className="w-8 h-8 object-cover rounded" />
                          ) : att.type === 'video' ? (
                            <VideoIcon size={16} className="text-blue-400 shrink-0" />
                          ) : (
                            <FileText size={16} className="text-gray-400 shrink-0" />
                          )}
                          <span className="text-xs truncate">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {msg.content && (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-8 h-8 rounded flex items-center justify-center bg-[#000] border border-[#1a1a1a] shrink-0">
              <Bot size={14} className="text-blue-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm italic">
              <Loader2 size={14} className="animate-spin" />
              <span>Agent is thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div 
        className="p-4 border-t border-[#1a1a1a] bg-[#0d0d0d]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map(att => (
              <div key={att.id} className="relative flex items-center gap-2 bg-[#1a1a1a] border border-[#333] rounded-md p-1.5 pr-8 max-w-[200px] group">
                {att.type === 'image' && att.previewUrl ? (
                  <img src={att.previewUrl} alt="preview" className="w-6 h-6 object-cover rounded" />
                ) : att.type === 'video' ? (
                  <VideoIcon size={16} className="text-blue-400 shrink-0" />
                ) : (
                  <FileText size={16} className="text-gray-400 shrink-0" />
                )}
                <span className="text-xs text-gray-300 truncate">{att.name}</span>
                <button 
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-end bg-[#141414] border border-[#222] rounded-md transition-all focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20">
          <div className="p-3 text-blue-500 shrink-0">
            <ChevronRight size={18} />
          </div>
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isWorkspaceSelected ? "Type a command, paste text/images, or drag files here..." : "Type a prompt to select a folder and start..."}
            className="w-full bg-transparent py-3 pr-16 text-sm focus:outline-none resize-none max-h-[200px] overflow-y-auto placeholder:text-gray-700"
            disabled={isLoading}
            rows={1}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <label className="p-1.5 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
              <Paperclip size={16} />
              <input type="file" multiple className="hidden" onChange={handleFileSelect} />
            </label>
            <button
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className="p-1.5 text-gray-500 hover:text-blue-400 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
        <div className="mt-2 flex justify-between items-center px-1">
          <p className="text-[10px] text-gray-600 uppercase tracking-tighter">
            Shift+Enter for new line • Paste long text to create snippet
          </p>
          <div className="flex gap-2 items-center">
             <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
             <span className="text-[10px] text-gray-600">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

