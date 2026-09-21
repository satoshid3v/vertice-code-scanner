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
  const scanLoopRef = useRef<number | null>(null);

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
      const engineType = hasNative ? 'native_barcode_detector' : 'wasm_fallback';
      setState(s => ({ 
        ...s, 
        hasCameraPermission: true, 
        activeEngine: engineType,
        isInitializing: false,
        isScanning: true
      }));

      const videoEl = configRef.current.videoRef.current;
      
      // 1. Inicializar Motores
      let nativeDetector: any = null;
      let wasmReader: any = null;
      let canvas: HTMLCanvasElement | null = null;
      let ctx: CanvasRenderingContext2D | null = null;

      if (hasNative) {
        nativeDetector = new window.BarcodeDetector({
          formats: configRef.current.formats || ['qr_code', 'code_128', 'ean_13', 'upc_a']
        });
      } else {
        const wasmModule = await import('zxing-wasm/reader');
        wasmReader = wasmModule.readBarcodes;
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d', { willReadFrequently: true });
      }

      // 2. Definir Bucle de Escaneo
      let isCooldown = false;
      const scanLoop = async () => {
        // Romper el ciclo si el video fue apagado (stopScanner)
        if (!videoEl || !videoEl.srcObject) return;

        if (videoEl.readyState >= 2 && !isCooldown) {
          try {
            let foundResult = null;

            if (hasNative && nativeDetector) {
              // Carril Rápido: Cero Copias de Memoria
              const barcodes = await nativeDetector.detect(videoEl);
              if (barcodes.length > 0) {
                foundResult = {
                  rawValue: barcodes[0].rawValue,
                  format: barcodes[0].format,
                  timestamp: Date.now(),
                  engineUsed: engineType
                };
              }
            } else if (wasmReader && canvas && ctx) {
              // Carril Lento (Fallback): Dibujar en Canvas y enviar a Wasm
              canvas.width = videoEl.videoWidth;
              canvas.height = videoEl.videoHeight;
              ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              const barcodes = await wasmReader(imageData, { tryHarder: false });
              if (barcodes.length > 0) {
                let formatStr: any = barcodes[0].format.toLowerCase();
                if (formatStr === 'qrcode') formatStr = 'qr_code';
                if (formatStr === 'code128') formatStr = 'code_128';
                
                foundResult = {
                  rawValue: barcodes[0].text,
                  format: formatStr,
                  timestamp: Date.now(),
                  engineUsed: engineType
                };
              }
            }

            if (foundResult) {
              isCooldown = true;
              configRef.current.onDetect(foundResult as any);
              // Cooldown de 1.5s antes de volver a leer para evitar spam de eventos
              setTimeout(() => { isCooldown = false; }, 1500);
            }
          } catch (e) {
            console.warn("[VerticeScanner] Warning en frame:", e);
          }
        }

        // Programar siguiente frame
        if ('requestVideoFrameCallback' in videoEl) {
          scanLoopRef.current = (videoEl as any).requestVideoFrameCallback(scanLoop);
        } else {
          scanLoopRef.current = requestAnimationFrame(scanLoop);
        }
      };

      // Iniciar el bucle
      scanLoop();

    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, isInitializing: false }));
      configRef.current.onError?.(err);
    }
  }, []);

  const stopScanner = useCallback(() => {
    setState(s => ({ ...s, isScanning: false }));
    const videoEl = configRef.current.videoRef.current;
    
    // Detener el bucle visual
    if (scanLoopRef.current !== null) {
      if (videoEl && 'cancelVideoFrameCallback' in videoEl) {
        (videoEl as any).cancelVideoFrameCallback(scanLoopRef.current);
      } else {
        cancelAnimationFrame(scanLoopRef.current);
      }
      scanLoopRef.current = null;
    }

    // Apagar la cámara física
    if (videoEl && videoEl.srcObject) {
      const stream = videoEl.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoEl.srcObject = null;
    }
  }, []);

  return { state, startScanner, stopScanner };
}
