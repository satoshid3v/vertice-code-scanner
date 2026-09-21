import React, { useRef, useEffect } from 'react';
import { useVerticeScanner } from '../hooks/useVerticeScanner';
import { ScannerOverlay } from './ScannerOverlay';
import { VerticeScanResult } from '../core/scannerEngine';

/**
 * @author Vertice Code
 * @description Contenedor principal del Modal de Escaneo.
 */

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: VerticeScanResult) => void;
}

export function ScannerModal({ isOpen, onClose, onResult }: ScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { state, startScanner, stopScanner } = useVerticeScanner({
    videoRef,
    formats: ['qr_code', 'code_128', 'ean_13', 'upc_a'],
    onDetect: (result) => {
      stopScanner();
      onResult(result);
    },
    onError: (err) => {
      console.error("[VerticeScanner] Error:", err);
    }
  });

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      {/* Modal Container */}
      <div className="relative w-full max-w-lg h-[80vh] max-h-[800px] overflow-hidden rounded-[2rem] bg-slate-900 border border-white/10 shadow-2xl ring-1 ring-white/10">
        
        {/* Video Element (Underneath everything) */}
        <video 
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Glassmorphic Overlay UI */}
        <ScannerOverlay state={state} onClose={onClose} />
      </div>
    </div>
  );
}
