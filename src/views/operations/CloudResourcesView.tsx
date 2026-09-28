import React from 'react';
import { CloudResourcesPanel } from '../../components/telemetry/CloudResourcesPanel';

export const CloudResourcesView: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 bg-slate-950 text-slate-100 min-h-full space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">
          Cloud Resources &amp; Envoy Mesh View
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Cluster Capacity, Virtual Memory, NVMe IOPS, and strict mTLS 1.3 Telemetry
        </p>
      </div>

      <CloudResourcesPanel />
    </div>
  );
};

export default CloudResourcesView;
