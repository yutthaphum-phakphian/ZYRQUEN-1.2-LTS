import React from 'react';
import { EmergencyOverrideConsole } from './EmergencyOverrideConsole';
import { SubKelvinThermalMonitor } from './SubKelvinThermalMonitor';
import { AutoHealingLog } from './AutoHealingLog';

export const SovereignCommandHub: React.FC<{
  onOverrideStateChange?: (active: boolean) => void;
}> = ({ onOverrideStateChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubKelvinThermalMonitor />
        <AutoHealingLog />
      </div>
      <EmergencyOverrideConsole onOverrideStateChange={onOverrideStateChange} />
    </div>
  );
};
