import React from 'react';
import { Scan, AlertCircle, Loader2, X } from 'lucide-react';
import { VerticeScannerState } from '../core/scannerEngine';

/**
 * @author Vertice Code
 * @description Glassmorphic Scanner Overlay
 */

interface ScannerOverlayProps {
  state: VerticeScannerState;
  onClose: () => void;
}

export function ScannerOverlay({ state, onClose }: ScannerOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
      {/* Top Glassmorphic Bar */}
      <div className="w-full p-4 pointer-events-auto">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm tracking-wide">Vertice Scanner Engine</h2>
              <p className="text-white/70 text-xs">Zero-Trust • Edge AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors group"
          >
            <X className="w-5 h-5 text-white/70 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* Center Reticle (The Scanner Box) */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Dark mask around the scanning area */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        
        {/* Clear scanning zone with glassmorphic borders */}
        <div className="relative w-64 h-64 z-20">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>

          {/* Animated Laser (White) */}
          {state.isScanning && !state.error && (
            <div className="absolute top-0 left-0 w-full h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,1)] animate-[scan_2s_ease-in-out_infinite]" />
          )}

          {/* State Indicators over the box */}
          {state.isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm rounded-xl">
              <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
              <span className="text-white text-xs font-medium tracking-wider">CALIBRANDO</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="w-full p-4 pointer-events-auto">
        <div className={`backdrop-blur-md border shadow-xl rounded-2xl p-4 flex items-center justify-center transition-all ${
          state.error ? 'bg-red-500/10 border-red-500/30' : 'bg-white/10 border-white/20'
        }`}>
          {state.error ? (
            <div className="flex items-center gap-2 text-red-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{state.error}</span>
            </div>
          ) : (
            <span className="text-white/80 text-sm font-medium tracking-wide">
              {state.activeEngine === 'native_barcode_detector' ? '⚡ Aceleración NPU Activa' : state.activeEngine === 'wasm_fallback' ? '🔧 Fallback Wasm Activo' : 'Esperando motor...'}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(16rem); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
