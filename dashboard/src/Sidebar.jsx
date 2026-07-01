// display and navigate current project directory  

import React from 'react';
import { FolderTree } from 'lucide-react';

function Sidebar({ data = {}, onNavigateUp, onFileClick }) {
  return (
    <aside className="col-span-3 border-r border-slate-800 p-6 bg-[#0f172a]/30 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div>
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
            <FolderTree size={16} /> Current Directory
          </h2>

          {/* current folder title */}
          <div
            onClick={onNavigateUp}
            // current folder name display 
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400 max-w-full truncate select-none transition-colors ${data?.activeFile && data.activeFile !== './' && data.activeFile !== ''
                ? 'cursor-pointer hover:bg-blue-500/20 hover:text-blue-300'
                : 'cursor-not-allowed opacity-70'
              }`}
            title={data?.activeFile && data.activeFile !== './' ? "Click to go up one folder" : "Root directory"}
          >
            {/* handle root icon and name display */}
            <span className="opacity-60">
              {data?.activeFile && data.activeFile !== './' && data.activeFile !== '' ? '⬆️' : '📂'} 
            </span> 
            <span className="truncate">
              {data && data.activeFile
                ? data.activeFile.replace(/\/$/, '') || './'
                : './'}
            </span>
          </div>
        </div>

        {/* current folder/files agent is reading */}
        <div className="space-y-2">
          {data && data.files ? (
            data.files.map((file, idx) => {
              const isSelected = data.activeFile && data.activeFile.endsWith(file.name);
              const isFile = file.type === 'file';

              return (
                <div
                  key={idx}
                  onClick={() => onFileClick(file)}
                  className={`flex items-center gap-2 text-sm transition-all px-2 py-1 rounded-md cursor-pointer select-none ${isSelected
                      ? 'text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20'
                      : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800/40'
                    }`}
                >
                  <span>{file.type === 'directory' ? '📂' : '📄'}</span>
                  <span className="truncate">{file.name}</span>
                </div>
              );
            })
          ) : (
            <div className="opacity-50 italic text-sm text-slate-500">
              Nothing in here
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default React.memo(Sidebar);