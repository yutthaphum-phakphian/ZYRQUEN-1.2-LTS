import { useState, useEffect } from 'react';
import { systemStateStore, SystemState } from '../store/systemStateStore';

export function useSystemState(): SystemState {
  const [state, setState] = useState<SystemState>(systemStateStore.getState());

  useEffect(() => {
    const unsubscribe = systemStateStore.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}
