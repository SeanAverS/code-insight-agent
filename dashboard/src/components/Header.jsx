// display title and agent connection status in header 

import React from 'react';
import { Layout } from 'lucide-react';

export default function Header({ isAgentConnected }) {
  return (
    <header className="h-16 border-b border-slate-800 flex items-center px-8 justify-between bg-[#0f172a] sticky top-0 z-10">
        {/* title */}
      <div className="flex items-center gap-3">
        <Layout size={20} />
        <h1 className="font-bold text-xl">AGENT <span className="text-blue-400">DASHBOARD</span></h1>
      </div>
      
      {/* agent connection status */}
      <div className="flex items-center gap-4 text-xs font-mono">
        {isAgentConnected ? (
          <span className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 px-2.5 py-1.5 border border-emerald-500/10 rounded-md">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            CONNECTED
          </span>
        ) : (
          <span className="flex items-center gap-2 text-rose-400 bg-rose-500/5 px-2.5 py-1.5 border border-rose-500/10 rounded-md">
            <div className="w-2 h-2 bg-rose-500 rounded-full" />
            DISCONNECTED
          </span>
        )}
      </div>
    </header>
  );
}