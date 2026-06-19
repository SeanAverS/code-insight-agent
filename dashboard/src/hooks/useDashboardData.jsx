// check agent connection status based on data.json fetch 

import { useState, useEffect } from 'react';

export function useDashboardData() {
  const [data, setData] = useState(null);
  const [isAgentConnected, setIsAgentConnected] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      fetch('/data.json')
        .then(res => {
          if (!res.ok) throw new Error("Offline");
          return res.json();
        })
        .then(json => {
          setData(json);
          setIsAgentConnected(true);
        })
        .catch(() => {
          setIsAgentConnected(false);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return { data, isAgentConnected };
}