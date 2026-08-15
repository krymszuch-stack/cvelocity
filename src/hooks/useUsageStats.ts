import { useState, useEffect, useCallback } from 'react';
import { semanticCacheInstance } from '../lib/semanticCache';
import { TokenStats } from '../types';

export function useUsageStats() {
  const [stats, setStats] = useState<TokenStats>(() => semanticCacheInstance.getStats());

  const refreshStats = useCallback(() => {
    setStats(semanticCacheInstance.getStats());
  }, []);

  useEffect(() => {
    refreshStats();
    // Poll or listen for updates
    const interval = setInterval(refreshStats, 3000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
  };
}
