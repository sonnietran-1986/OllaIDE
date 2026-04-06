import React, { useState, useEffect } from 'react';
import { FolderOpen, LogOut, Settings, Terminal as TerminalIcon, Folder } from 'lucide-react';

interface SidebarProps {
  workspaceName: string | null;
  onSelectWorkspace: () => void;
  onCloseWorkspace: () => void;
  onConfigClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  width: number;
  onWidthChange: (width: number) => void;
}

export default function Sidebar({ 
  workspaceName,
  onSelectWorkspace,
  onCloseWorkspace,
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

      {/* Open Project */}
      <div className="px-4 mb-4">
        <button
          onClick={onSelectWorkspace}
          className={`flex items-center justify-center gap-2 py-2.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded text-xs font-bold text-gray-300 transition-all active:scale-95 ${isCollapsed ? 'w-8 h-8 p-0 mx-auto' : 'w-full'}`}
          title="Open Project"
        >
          <FolderOpen size={14} />
          {!isCollapsed && "OPEN PROJECT"}
        </button>
      </div>

      {/* Current Project */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-hide">
        {!isCollapsed && (
          <div className="px-3 mb-2">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Current Workspace</p>
          </div>
        )}
        {workspaceName ? (
          <div className={`flex items-center gap-3 py-2 rounded text-left text-xs bg-[#1a1a1a] text-white border border-[#333] ${isCollapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : 'w-full px-3'}`} title={workspaceName}>
            <Folder size={14} className="text-blue-400 shrink-0" />
            {!isCollapsed && <span className="truncate flex-1">{workspaceName}</span>}
          </div>
        ) : (
          !isCollapsed && <p className="text-xs text-gray-600 px-3 italic">No project selected</p>
        )}
      </div>

      {/* Footer */}
      <div className={`p-4 border-t border-[#1a1a1a] flex flex-col gap-4 ${isCollapsed ? 'items-center' : ''}`}>
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
            onClick={onCloseWorkspace}
            className={`flex items-center justify-center gap-2 py-2 text-[10px] text-red-500/70 hover:text-red-400 hover:bg-red-500/5 rounded transition-colors ${isCollapsed ? 'w-8 h-8 p-0' : ''}`}
            title="Close Workspace"
          >
            <LogOut size={12} />
            {!isCollapsed && "CLOSE"}
          </button>
        </div>
      </div>
    </div>
  );
}
