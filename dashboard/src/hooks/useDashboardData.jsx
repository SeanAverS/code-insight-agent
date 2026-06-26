// check agent connection status based on data.json fetch 

import { useState, useEffect, useRef } from 'react';

export function useDashboardData() {
  const [data, setData] = useState(null);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const lastDataRef = useRef(null);

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
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return { data, isAgentConnected };
}