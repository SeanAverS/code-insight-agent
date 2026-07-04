// view latest file state and apply agent changes

import React, { useCallback, useEffect, useRef } from 'react';
import { MessageSquareCode } from 'lucide-react';
import CodeLineLogic from './CodeLineLogic';

function CodeView({ data, hasChanges }) {
    const isMounted = useRef(true);

    // check if component is currently active 
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // handle applying agent changes to local file    
    const handleApplyChanges = useCallback(() => {
        fetch('/api/apply-changes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ relative_path: data?.activeFile, content: data?.proposedCode }),
        })
            .then(() => {
                if (isMounted.current) alert("Changes applied!");
            })
            .catch(err => {
                if (isMounted.current) console.error("Error applying changes:", err);
            });
    }, [data?.activeFile, data?.proposedCode]);

    // handle syncing dashboard to local file state   
    const handleSync = useCallback(() => {
        fetch('/api/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ relativePath: data?.activeFile }),
        })
            .catch(err => {
                if (isMounted.current) console.error("Sync error:", err);
            });
    }, [data?.activeFile]);

    // text if no file selected
    if (!data?.currentCode) {
        return (
            <div className="font-mono text-sm text-slate-400 leading-relaxed bg-black/20 p-4 rounded-lg">
                Click a file to see its code, then Prompt to see agent suggestions
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-2 gap-5">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                    {/* title based on file state */}
                    <MessageSquareCode size={16} className={hasChanges ? "text-purple-400" : "text-slate-400"} />
                    {hasChanges ? "Proposed Changes" : "File Contents"}
                </h2>

                {/* apply agent changes to local file */}
                <div className="flex items-center gap-4">
                    {hasChanges && (
                        <button onClick={handleApplyChanges} className="text-[10px] uppercase font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-md hover:bg-purple-500/30 transition-all">
                            Apply Changes
                        </button>
                    )}

                    {/* sync dashboard to local file state */}
                    {data?.activeFile && (
                        <button
                            onClick={handleSync}
                            className="group flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider bg-slate-800/50 text-slate-400 border border-slate-700/50 px-2 py-1 rounded-md hover:bg-slate-800 hover:text-blue-400 hover:border-blue-500/30 transition-all active:scale-95"
                            title="Sync dashboard"
                        >
                            <span>🔄</span>
                            Sync
                        </button>
                    )}
                </div>
            </div>

            {/* display current file name */}
            {data?.activeFile && <span className="text-[11px] font-mono text-slate-500 block mb-2">{data.activeFile}</span>}

            {/* guide for code lines */}
            <div className="flex flex-col h-[400px] bg-black/30 rounded-xl border border-slate-800/60 overflow-hidden font-mono text-[12px]">
                {hasChanges && (
                    <div className="bg-slate-950/50 px-3 py-1.5 border-b border-slate-800/60 text-[10px] text-slate-500 font-bold tracking-wider">
                        <div className="flex gap-4">
                            <span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Additions</span>
                            <span className="text-rose-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Removals</span>
                        </div>
                    </div>
                )}

                {/* code lines for file after agent changes */}
                <div className="flex-1 p-3 overflow-auto leading-relaxed">
                    <CodeLineLogic currentCode={data.currentCode} proposedCode={data.proposedCode} />
                </div>
            </div>
        </div>
    );
}

export default React.memo(CodeView, (prev, next) => {
    // Only re-render if file data changes
    return prev.data === next.data && prev.hasChanges === next.hasChanges;
});