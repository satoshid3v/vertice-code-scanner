import { useState, useCallback, useRef, useEffect } from 'react';
import type { VerticeScannerConfig, VerticeScannerState } from '../core/scannerEngine';

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

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const startScanner = useCallback(async () => {
    setState(s => ({ ...s, isInitializing: true, error: null }));
    try {
      if (!configRef.current.videoRef.current) throw new Error("Video ref is missing");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      configRef.current.videoRef.current.srcObject = stream;
      
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
      configRef.current.onError?.(err);
    }
  }, []);

  const stopScanner = useCallback(() => {
    setState(s => ({ ...s, isScanning: false }));
    if (configRef.current.videoRef.current && configRef.current.videoRef.current.srcObject) {
      const stream = configRef.current.videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      configRef.current.videoRef.current.srcObject = null;
    }
  }, []);

  return { state, startScanner, stopScanner };
}
