// navigate through project directory and select a file

export function useFileExplorer() {
  // handle navigating up a directory 
  const navigateUp = (activeFile) => {
    const currentFolder = activeFile ? activeFile.replace(/\/$/, '') : '';
    if (!currentFolder || currentFolder === '.' || currentFolder === './') return;

    fetch('/api/select-dir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath: currentFolder, goUp: true }),
    }).catch(err => console.error("Error navigating up:", err));
  };

  // handle selecting a file 
  const selectFile = (file) => {
    const endpoint = file.type === 'file' ? '/api/select-file' : '/api/select-dir';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relativePath: file.relativePath }),
    }).catch(err => console.error(`Error updating view for ${file.name}:`, err));
  };

  return { navigateUp, selectFile };
}