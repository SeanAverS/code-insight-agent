// navigate through project directory and select files
import { useCallback } from 'react';

export function useFileExplorer(manualRefresh) {
  // handle navigating up a directory 
  const navigateUp = useCallback((activeFile) => {
    const currentFolder = activeFile ? activeFile.replace(/\/$/, '') : '';
    if (!currentFolder || currentFolder === '.' || currentFolder === './') return;

    fetch('/api/select-dir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath: currentFolder, goUp: true }),
    })
    .then(() => manualRefresh())
    .catch(err => console.error("Error navigating up:", err));
  }, [manualRefresh]);

  // handle selecting a file 
  const selectFile = useCallback((file) => {
    const endpoint = file.type === 'file' ? '/api/select-file' : '/api/select-dir';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath: file.relativePath }),
    })
    .then(() => manualRefresh())
    .catch(err => console.error(`Error updating view for ${file.name}:`, err));
  }, [manualRefresh]);

  return { navigateUp, selectFile };
}