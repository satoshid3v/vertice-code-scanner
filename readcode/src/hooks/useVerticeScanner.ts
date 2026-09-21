import { useState, useEffect, useCallback } from 'react';
import { VerticeScannerConfig, VerticeScannerState } from '../core/scannerEngine';

/**
 * @author Vertice Code
 * @description Hook principal para orquestar el escáner nativo y el fallback.
 */
export function useVerticeScanner(config: VerticeScannerConfig) {
  const [state, setState] = useState<VerticeScannerState>({
    isInitializing: false,
    isScanning: false,
    hasCameraPermission: false,
    activeEngine: 'none',
    error: null
  });

  const startScanner = useCallback(async () => {
    setState(s => ({ ...s, isInitializing: true, error: null }));
    try {
      if (!config.videoRef.current) throw new Error("Video ref is missing");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      config.videoRef.current.srcObject = stream;
      
      // Determine Engine
      const hasNative = 'BarcodeDetector' in window;
      setState(s => ({ 
        ...s, 
        hasCameraPermission: true, 
        activeEngine: hasNative ? 'native_barcode_detector' : 'wasm_fallback',
        isInitializing: false,
        isScanning: true
      }));

      // TODO: Implement requestVideoFrameCallback loop here

    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, isInitializing: false }));
      config.onError?.(err);
    }
  }, [config]);

  const stopScanner = useCallback(() => {
    setState(s => ({ ...s, isScanning: false }));
    if (config.videoRef.current && config.videoRef.current.srcObject) {
      const stream = config.videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      config.videoRef.current.srcObject = null;
    }
  }, [config]);

  return { state, startScanner, stopScanner };
}
