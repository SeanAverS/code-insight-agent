// chart to display length of files in current directory 

import React from 'react';
import { Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function FileLengthChart({ files }) {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <Activity size={16} className="text-blue-400" /> File Length
      </h2>
      <div className="h-64">
        {files ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={files.slice(0, 20)}>
              <XAxis dataKey="name" hide />
              <Tooltip cursor={false} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey={(f) => f.name.length} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">No data analyzed yet.</div>
        )}
      </div>
    </div>
  );
}