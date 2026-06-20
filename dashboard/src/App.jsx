import React from 'react';
import { Layout } from 'lucide-react';
import CodeLineLogic from './components/CodeLineLogic';
import Header from './components/Header'
import Sidebar from './Sidebar';
import FileLengthChart from './components/FileLengthChart';
import CodeView from './components/CodeView';
import { useDashboardData } from './hooks/useDashboardData';
import { useFileExplorer } from './hooks/useFileExplorer';

export default function ScoutDashboard() {
  const { data, isAgentConnected } = useDashboardData();
  const { navigateUp, selectFile } = useFileExplorer();
  const hasChanges = data?.proposedCode && data.proposedCode !== data.currentCode;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex flex-col">
      <Header isAgentConnected={isAgentConnected} />

      <main className="flex-1 grid grid-cols-12 gap-0">
        <Sidebar 
          data={data} 
          onNavigateUp={() => navigateUp(data?.activeFile)} 
          onFileClick={selectFile}
        />

        <section className="col-span-9 p-4 space-y-8">
          <FileLengthChart files={data?.files} />
          <CodeView data={data} hasChanges={hasChanges} />
        </section>
      </main>
    </div>
  );
}