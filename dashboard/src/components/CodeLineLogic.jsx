// handle display of new and deleted code lines based on an agent's suggested changes 

import React, { memo } from 'react';

function CodeLineLogic({ currentCode, proposedCode }) {
  const originalLines = currentCode.split('\n');
  const proposedLines = proposedCode ? proposedCode.split('\n') : [];

  // render consistent line alignment 
  const renderRow = (content, type, key) => {
  let rowClasses = "grid grid-cols-[2rem_1fr] items-center min-h-[1.5rem] font-mono ";
  let symbol = "-";
  
  if (type === 'remove') {
    rowClasses += "bg-rose-950/20 text-rose-300 line-through decoration-rose-500/50";
    symbol = "-";
  } else if (type === 'add') {
    rowClasses += "bg-emerald-950/20 text-emerald-300 font-medium";
    symbol = "+";
  } else { // no proposed changes yet  
    rowClasses += "text-slate-400 hover:bg-slate-800/10";
    symbol = "-";
  }

  return (
    <div key={key} className={rowClasses}>
      {/* column 1: line alignement */}
      <span className="text-right pr-4 select-none opacity-60 font-bold">
        {symbol}
      </span>
      {/* column 2: code */}
      <span className="whitespace-pre overflow-hidden">{content || ' '}</span>
    </div>
  );
};

  // fallback: no proposal yet
  if (proposedLines.length === 0) {
    return originalLines.map((line, idx) => renderRow(line, 'match', `fallback-${idx}`));
  }

  // track original and proposed lines at same time
  const renderedElements = [];
  let origIdx = 0;
  let propIdx = 0;

  while (origIdx < originalLines.length || propIdx < proposedLines.length) {
    const origLine = originalLines[origIdx];
    const propLine = proposedLines[propIdx];

    // case 1: show original lines deleted 
    // reaches end of proposed lines but original still has lines 
    if (propLine === undefined && origLine !== undefined) {
      // render deleted line red
      renderedElements.push(renderRow(origLine, 'remove', `remove-${origIdx}`));
      origIdx++; // scan next deleted line
      continue;
    }

    // case 2: show added proposed lines
    // reaches end of original lines but proposed still has lines 
    if (origLine === undefined && propLine !== undefined) {
      // render proposed line green 
      renderedElements.push(renderRow(propLine, 'add', `add-${propIdx}`));
      propIdx++; // scan next proposed line
      continue;
    }

    // case 3: lines match perfectly(unchanged code)
    const cleanOrig = origLine.trim();
    const cleanProp = propLine.trim();

    if (cleanOrig === cleanProp) {
      // render line grey 
      renderedElements.push(renderRow(propLine, 'match', `match-${propIdx}`));
      // scan next line together
      origIdx++;
      propIdx++;
    } else { // lines do not match 
      // case 4: check if line was deleted or inserted
      // can the proposed file eventually come across current line from the original file?
      const existsAheadInProp = proposedLines.slice(propIdx).some(pl => pl.trim() === cleanOrig);

      if (!existsAheadInProp) { // original line was deleted, render this red 
        renderedElements.push(renderRow(origLine, 'remove', `remove-${origIdx}`));
        origIdx++; // check if next line matches proposed pointer
      } else { // proposed line was inserted, render this green
        renderedElements.push(renderRow(propLine, 'add', `add-${propIdx}`));
        propIdx++; // check if next line matches original pointer 
      }
    }
  }

  return <div className="border border-slate-800 rounded-lg overflow-hidden">{renderedElements}</div>;
}

export default memo(CodeLineLogic, (prev, next) => {
  return prev.currentCode === next.currentCode && prev.proposedCode === next.proposedCode;
});