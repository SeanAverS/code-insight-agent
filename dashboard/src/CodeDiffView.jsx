// handle display of new and deleted code lines based on an agent's suggested changes 

import React from 'react';

export default function DiffViewer({ currentCode, proposedCode }) {
  const originalLines = currentCode.split('\n');
  const proposedLines = proposedCode ? proposedCode.split('\n') : [];

  // fallback: no proposal yet
  if (proposedLines.length === 0) {
    return originalLines.map((line, idx) => (
      <div key={idx} className="hover:bg-slate-800/20 px-2 rounded font-normal text-slate-400 flex">
        <span className="inline-block w-8 select-none opacity-40 text-right mr-4 text-slate-500">{idx + 1}</span>
        {line || ' '}
      </div>
    ));
  }

  // track original and proposed lines at same time
  const renderedElements = [];
  let origIdx = 0;
  let propIdx = 0;
  let lineNum = 1;

  while (origIdx < originalLines.length || propIdx < proposedLines.length) {
    const origLine = originalLines[origIdx];
    const propLine = proposedLines[propIdx];

    // case 1: show original lines deleted 
    // reaches end of proposed lines but original still has lines 
    if (propLine === undefined && origLine !== undefined) {
      // render deleted line red
      renderedElements.push(
        <div key={`rem-${origIdx}`} className="bg-rose-950/20 text-rose-300 border-l-2 border-rose-500 px-2 my-0.5 line-through decoration-rose-500/50 flex">
          <span className="inline-block w-8 select-none text-rose-600/60 text-right mr-4">-</span>
          {origLine}
        </div>
      );
      origIdx++; // scan next deleted line
      continue;
    }

    // case 2: show added proposed lines
    // reaches end of original lines but proposed still has lines 
    if (origLine === undefined && propLine !== undefined) {
      // render proposed line green 
      renderedElements.push(
        <div key={`add-${propIdx}`} className="bg-emerald-950/20 text-emerald-300 border-l-2 border-emerald-500 px-2 my-0.5 font-medium flex">
          <span className="inline-block w-8 select-none text-emerald-600/60 text-right mr-4">+</span>
          {propLine}
        </div>
      );
      propIdx++; // scan next proposed line
      continue;
    }

    // case 3: lines match perfectly(unchanged code)
    const cleanOrig = origLine.trim();
    const cleanProp = propLine.trim();

    if (cleanOrig === cleanProp) {
      // render line grey 
      renderedElements.push(
        <div key={`match-${propIdx}`} className="hover:bg-slate-800/10 text-slate-400 px-2 opacity-80 flex">
          <span className="inline-block w-8 select-none opacity-40 text-right mr-4 text-slate-500">{lineNum++}</span>
          {propLine || ' '}
        </div>
      );
      // scan next line together
      origIdx++;
      propIdx++;
    } else { // lines do not match 
      // case 4: check if line was deleted or inserted
      // can the proposed file eventually come across current line from the original file?
      const existsAheadInProp = proposedLines.slice(propIdx).some(pl => pl.trim() === cleanOrig);

      if (!existsAheadInProp) { // original line was deleted, render this red 
        renderedElements.push(
          <div key={`rem-${origIdx}`} className="bg-rose-950/20 text-rose-300 border-l-2 border-rose-500 px-2 my-0.5 line-through decoration-rose-500/50 flex">
            <span className="inline-block w-8 select-none text-rose-600/60 text-right mr-4">-</span>
            {origLine}
          </div>
        );
        origIdx++; // check if next line matches proposed pointer
      } else { // proposed line was inserted, render this green
        renderedElements.push(
          <div key={`add-${propIdx}`} className="bg-emerald-950/20 text-emerald-300 border-l-2 border-emerald-500 px-2 my-0.5 font-medium flex">
            <span className="inline-block w-8 select-none text-emerald-600/60 text-right mr-4">+</span>
            {propLine}
          </div>
        );
        propIdx++; // check if next line matches original pointer 
      }
    }
  }

  return renderedElements;
}