import { useSyncExternalStore } from 'react';
import { systemStateStore, SystemState } from '../store/systemStateStore';

export function useSystemState(): SystemState {
  return useSyncExternalStore(
    (callback) => systemStateStore.subscribe(callback),
    () => systemStateStore.getState(),
    () => systemStateStore.getState()
  );
}
