import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, LogOut, Github, Settings, Terminal as TerminalIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface Session {
  id: string;
  title: string;
  updatedAt: number;
}

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onNewSession: () => void;
  onSignOut: () => void;
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  onConfigClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  width: number;
  onWidthChange: (width: number) => void;
}

export default function Sidebar({ 
  sessions, 
  currentSessionId, 
  onSessionSelect, 
  onNewSession, 
  onSignOut,
  user,
  onConfigClick,
  isCollapsed,
  onToggleCollapse,
  width,
  onWidthChange
}: SidebarProps) {
  
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 500) newWidth = 500;
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  return (
    <div 
      style={{ width: isCollapsed ? 64 : width }} 
      className="h-full bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col font-mono relative transition-[width] duration-300 ease-in-out flex-shrink-0"
    >
      {/* Resize Handle */}
      {!isCollapsed && (
        <div 
          className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/50 z-10 transition-colors"
          onMouseDown={() => setIsResizing(true)}
        />
      )}

      {/* Logo */}
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <button 
          onClick={onToggleCollapse}
          className="w-8 h-8 bg-white rounded flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
          title="Toggle Sidebar"
        >
          <TerminalIcon size={18} className="text-black" />
        </button>
        {!isCollapsed && <h1 className="text-lg font-bold tracking-tighter text-white truncate">OllaIDE</h1>}
      </div>

      {/* New Chat */}
      <div className="px-4 mb-4">
        <button
          onClick={onNewSession}
          className={`flex items-center justify-center gap-2 py-2.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded text-xs font-bold text-gray-300 transition-all active:scale-95 ${isCollapsed ? 'w-8 h-8 p-0 mx-auto' : 'w-full'}`}
          title="New Session"
        >
          <Plus size={14} />
          {!isCollapsed && "NEW SESSION"}
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-hide">
        {!isCollapsed && (
          <div className="px-3 mb-2">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Recent Activity</p>
          </div>
        )}
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSessionSelect(session.id)}
            className={`flex items-center gap-3 py-2 rounded text-left text-xs transition-colors group ${
              currentSessionId === session.id 
                ? 'bg-[#1a1a1a] text-white border border-[#333]' 
                : 'text-gray-500 hover:bg-[#141414] hover:text-gray-300'
            } ${isCollapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : 'w-full px-3'}`}
            title={session.title}
          >
            <MessageSquare size={14} className={currentSessionId === session.id ? 'text-blue-400' : 'text-gray-700'} />
            {!isCollapsed && <span className="truncate flex-1">{session.title}</span>}
          </button>
        ))}
      </div>

      {/* Footer / User */}
      <div className={`p-4 border-t border-[#1a1a1a] flex flex-col gap-4 ${isCollapsed ? 'items-center' : ''}`}>
        {user && !isCollapsed && (
          <div className="flex items-center gap-3 px-2">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
              alt="Avatar" 
              className="w-8 h-8 rounded border border-[#333]"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-300 truncate">{user.displayName || 'Anonymous'}</p>
              <p className="text-[10px] text-gray-600 truncate">{user.email}</p>
            </div>
          </div>
        )}
        {user && isCollapsed && (
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
            alt="Avatar" 
            className="w-8 h-8 rounded border border-[#333]"
            referrerPolicy="no-referrer"
            title={user.displayName || 'User'}
          />
        )}

        <div className={`grid gap-2 ${isCollapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <button 
            onClick={onConfigClick}
            className={`flex items-center justify-center gap-2 py-2 text-[10px] text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a] rounded transition-colors ${isCollapsed ? 'w-8 h-8 p-0' : ''}`}
            title="Config"
          >
            <Settings size={12} />
            {!isCollapsed && "CONFIG"}
          </button>
          <button 
            onClick={onSignOut}
            className={`flex items-center justify-center gap-2 py-2 text-[10px] text-red-500/70 hover:text-red-400 hover:bg-red-500/5 rounded transition-colors ${isCollapsed ? 'w-8 h-8 p-0' : ''}`}
            title="Exit"
          >
            <LogOut size={12} />
            {!isCollapsed && "EXIT"}
          </button>
        </div>
      </div>
    </div>
  );
}
