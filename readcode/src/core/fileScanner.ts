import type { VerticeScanResult } from './scannerEngine';

/**
 * @author Vertice Code
 * @description Utilidad estricta para el escaneo de archivos de imagen estáticos.
 */

// Tipo extendido para soportar la API nativa (declaración temporal)
declare global {
  var BarcodeDetector: any;
}

export async function scanImageFile(file: File): Promise<VerticeScanResult | null> {
  try {
    // 1. Crear URL temporal para la imagen
    const imageUrl = URL.createObjectURL(file);
    
    // 2. Cargar la imagen en memoria
    const img = new Image();
    img.src = imageUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // 3. Evaluar el motor (Ruta A: Native First)
    if ('BarcodeDetector' in window) {
      const detector = new window.BarcodeDetector({
        formats: ['qr_code', 'code_128', 'ean_13', 'upc_a']
      });

      const barcodes = await detector.detect(img);
      URL.revokeObjectURL(imageUrl); // Limpieza estricta de memoria

      if (barcodes.length > 0) {
        return {
          rawValue: barcodes[0].rawValue,
          format: barcodes[0].format,
          timestamp: Date.now(),
          engineUsed: 'native_barcode_detector'
        };
      }
    } else {
      // Fallback Wasm Activo
      const { readBarcodes } = await import('zxing-wasm/reader');

      // Carga perezosa (Lazy Load) de OpenCV.js para mantener Zero-Bundle inicial
      let cvModule: any = await import('@techstark/opencv-js');
      let cv = cvModule.default || cvModule;

      // Esperar inicialización estricta de C++ WebAssembly
      if (typeof cv === 'function') {
        cv = await cv();
      } else if (cv instanceof Promise) {
        cv = await cv;
      }
      
      if (typeof cv.Mat !== 'function') {
        await new Promise<void>((resolve) => {
          cv.onRuntimeInitialized = resolve;
        });
      }

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      let imageData: ImageData | null = null;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, img.width, img.height);
        imageData = ctx.getImageData(0, 0, img.width, img.height);
      }

      // Estrategia "Escopeta de Perdigones" (Multi-Pass)
      // Ejecutamos diferentes algoritmos de binarización secuencialmente hasta que uno tenga éxito.
      const passes = [
        // Pase 1: Imagen original (Dejamos que ZXing intente su propia magia en C++)
        async () => {
          return await readBarcodes(file, { tryHarder: true, tryInvert: true });
        },
        // Pase 2: OpenCV Adaptive Threshold (Para sombras)
        async () => {
          if (!imageData) return [];
          const src = new cv.Mat(img.height, img.width, cv.CV_8UC4);
          src.data.set(imageData.data);
          const dst = new cv.Mat();
          cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
          cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, 15);
          cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA, 0);
          const pData = new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows);
          src.delete(); dst.delete();
          return await readBarcodes(pData, { tryHarder: true, tryInvert: true });
        },
        // Pase 3: OpenCV Estricto (Otsu) para alto contraste
        async () => {
          if (!imageData) return [];
          const src = new cv.Mat(img.height, img.width, cv.CV_8UC4);
          src.data.set(imageData.data);
          const dst = new cv.Mat();
          cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
          cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
          cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA, 0);
          const pData = new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows);
          src.delete(); dst.delete();
          return await readBarcodes(pData, { tryHarder: true, tryInvert: true });
        }
      ];

      let barcodes: any[] = [];
      for (const pass of passes) {
        try {
          barcodes = await pass();
          if (barcodes && barcodes.length > 0) break; // ¡Éxito! Detenemos los intentos.
        } catch (e) {
          console.warn("[VerticeScanner] Pase fallido, intentando el siguiente...", e);
        }
      }
      
      URL.revokeObjectURL(imageUrl);

      if (barcodes.length > 0) {
        // Mapeo básico de formatos para cumplir la interfaz estricta
        let formatStr: any = barcodes[0].format.toLowerCase();
        if (formatStr === 'qrcode') formatStr = 'qr_code';
        if (formatStr === 'code128') formatStr = 'code_128';
        if (formatStr === 'ean13') formatStr = 'ean_13';
        if (formatStr === 'upca') formatStr = 'upc_a';

        return {
          rawValue: barcodes[0].text,
          format: formatStr,
          timestamp: Date.now(),
          engineUsed: 'wasm_fallback'
        };
      }
      return null;
    }
  } catch (error) {
    console.error("[VerticeScanner] Error procesando archivo:", error);
    throw error;
  }
}
