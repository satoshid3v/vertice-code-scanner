import { VerticeScanResult } from './scannerEngine';

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
      return null;
    } else {
      // TODO: Implementar el fallback de zxing-wasm para imágenes
      URL.revokeObjectURL(imageUrl);
      throw new Error("BarcodeDetector nativo no soportado en este navegador. El fallback Wasm está en desarrollo.");
    }
  } catch (error) {
    console.error("[VerticeScanner] Error procesando archivo:", error);
    throw error;
  }
}
