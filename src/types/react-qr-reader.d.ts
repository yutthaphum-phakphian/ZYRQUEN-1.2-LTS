declare module 'react-qr-reader' {
  import * as React from 'react';

  export interface QrReaderProps {
    onResult?: (result: any | null | undefined, error: any | null | undefined) => void;
    constraints?: MediaTrackConstraints;
    scanDelay?: number;
    containerStyle?: React.CSSProperties;
    videoContainerStyle?: React.CSSProperties;
    videoStyle?: React.CSSProperties;
    className?: string;
    ViewFinder?: React.FC;
  }

  export const QrReader: React.FC<QrReaderProps>;

  export interface UseQrReaderHookProps {
    onResult?: (result: any | null | undefined, error: any | null | undefined) => void;
    constraints?: MediaTrackConstraints;
    scanDelay?: number;
    videoId?: string;
  }

  export function useQrReader(props: UseQrReaderHookProps): void;
}
