import React from 'react';
import { Layout, Activity, MessageSquareCode } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CodeDiffView from './components/CodeLineLogic';
import CodeView from './components/CodeView';
import FileLengthChart from './components/FileLengthChart';
import Sidebar from './Sidebar';
import Header from './components/Header'
import { useDashboardData } from './hooks/useDashboardData';
import { useFileExplorer } from './hooks/useFileExplorer';

export default function ScoutDashboard() {
  const { data, isAgentConnected } = useDashboardData();
  const { navigateUp, selectFile } = useFileExplorer();
  const hasChanges = data?.proposedCode && data.proposedCode !== data.currentCode;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex flex-col">

      {/* header */}
      <Header isAgentConnected={isAgentConnected} />

      {/* Sidebar */}
      <main className="flex-1 grid grid-cols-12 gap-0">
        <Sidebar 
          data={data} 
          onNavigateUp={() => navigateUp(data?.activeFile)} 
          onFileClick={selectFile}
        />

        {/* middle section */}
        <section className="col-span-9 p-4 space-y-8">
          {/* chart to visualize file lengths */}
          <FileLengthChart files={data?.files} />

          {/* view latest file state and apply agent changes */}
          <CodeView data={data} hasChanges={hasChanges} />

        </section>
      </main>
    </div>
  );
}