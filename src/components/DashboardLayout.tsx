import React from 'react';
import { ViewType, HardwareSnapshot } from '../types';
import { Room00MasterPanel } from './Room00MasterPanel';
import { Room01MasterPanel } from './Room01MasterPanel';
import { Room02MasterPanel } from './Room02MasterPanel';
import { Room03MasterPanel } from './Room03MasterPanel';
import { Room04MasterPanel } from './Room04MasterPanel';
import { Room05MasterPanel } from './Room05MasterPanel';
import { Room06MasterPanel } from './Room06MasterPanel';
import { Room07MasterPanel } from './Room07MasterPanel';
import { Room08MasterPanel } from './Room08MasterPanel';
import { Room09MasterPanel } from './Room09MasterPanel';
import { Room10MasterPanel } from './Room10MasterPanel';
import { Room11MasterPanel } from './Room11MasterPanel';
import { Room12MasterPanel } from './Room12MasterPanel';
import { Room13MasterPanel } from './Room13MasterPanel';
import { Room14MasterPanel } from './Room14MasterPanel';
import { Room15MasterPanel } from './Room15MasterPanel';
import { Room16MasterPanel } from './Room16MasterPanel';
import { Room17MasterPanel } from './Room17MasterPanel';
import { Room18MasterPanel } from './Room18MasterPanel';

export interface DashboardLayoutProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate,
}) => {
  return (
    <div className="space-y-8 p-6 bg-black min-h-screen">
      {/* ROOM00 to ROOM17 Panels */}
      <Room00MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room01MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room02MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room03MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room04MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room05MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room06MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room07MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room08MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room09MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room10MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room11MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room12MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room13MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room14MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room15MasterPanel onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room16MasterPanel onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />
      <Room17MasterPanel snapshots={snapshots} onNavigate={onNavigate} onOpenCertificate={onOpenCertificate} />

      {/* Complete Coverage: ROOM18 Register */}
      <section id="room-18-sentinel" className="w-full">
        <Room18MasterPanel
          snapshots={snapshots}
          onNavigate={onNavigate}
          onOpenCertificate={onOpenCertificate}
        />
      </section>
    </div>
  );
};

export default DashboardLayout;
