// check agent connection status based on data.json fetch 

import { useState, useEffect, useRef, useCallback} from 'react';

export function useDashboardData() {
  const [data, setData] = useState(null);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const lastDataRef = useRef(null);

  // force refresh for fast UI on navigation
  const manualRefresh = useCallback(() => {
    setTimeout(() => {
      fetch('/data.json')
        .then(res => res.json())
        .then(json => {
          lastDataRef.current = json; 
          setData(json);
          setIsAgentConnected(true);
        })
        .catch(() => setIsAgentConnected(false));
    }, 100); 
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = () => {
      fetch('/data.json', { signal: controller.signal })
        .then(res => {
          if (!res.ok) throw new Error("Offline");
          return res.json();
        })
        .then(json => {
          // only re-render if data.json changes
          if (JSON.stringify(lastDataRef.current) !== JSON.stringify(json)) {
            lastDataRef.current = json;
            setData(json);
          }
          setIsAgentConnected(true);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          setIsAgentConnected(false);
          setData(null)
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return { data, isAgentConnected, manualRefresh };
}