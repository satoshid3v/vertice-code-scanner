# Vertice Code: Barcode Engine 🚀

El motor de escaneo de códigos de barras de siguiente generación, diseñado como el sucesor espiritual y arquitectónico de `html5-qrcode`. 

Construido con **TypeScript Estricto**, **Zero-Bundle Nativo** y **Visión Computacional Avanzada (Multi-Pass OpenCV)**.

## ¿Por qué Vertice Code?

A diferencia de las librerías tradicionales que te obligan a descargar MBs de código obsoleto, este motor utiliza una **Arquitectura Híbrida**:
1. **Prioridad Nativa:** Intenta usar la API `BarcodeDetector` nativa del dispositivo (0 bytes de descarga, procesamiento por hardware local).
2. **Fallback "Escopeta de Perdigones":** Si el dispositivo es antiguo, inyecta asíncronamente (Lazy Load) `zxing-wasm` y `OpenCV.js`. Ejecuta 3 pases morfológicos en milisegundos para leer códigos destruidos, arrugados o rayados.

---

## 🛠️ Guía de Integración Rápida

La librería está diseñada específicamente para React. Olvídate de instanciar clases complejas de JavaScript manual. 

### 1. Escaneo en Vivo (Cámara)

Simplemente usa nuestro Hook `useVerticeScanner`. Todo el manejo de memoria y *streams* de video es gestionado automáticamente por nosotros.

```tsx
import { useRef } from 'react';
import { useVerticeScanner } from 'vertice-code-scanner/hooks';

export function EscanerEnVivo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const { state, startScanner, stopScanner } = useVerticeScanner({
    videoRef,
    formats: ['qr_code', 'code_128', 'ean_13'], // Formatos esperados
    onDetect: (resultado) => {
      console.log('Código detectado:', resultado.rawValue);
      console.log('Motor utilizado:', resultado.engineUsed); // 'native' o 'wasm_fallback'
      stopScanner(); // Detener al encontrar
    },
    onError: (error) => {
      console.error('Error de cámara:', error);
    }
  });

  return (
    <div className="relative w-full max-w-md mx-auto">
      <video ref={videoRef} className="w-full h-auto rounded-lg shadow-xl" autoPlay playsInline muted />
      
      <div className="mt-4 flex gap-2">
        <button onClick={startScanner} className="px-4 py-2 bg-blue-600 text-white rounded">
          {state.isInitializing ? 'Iniciando...' : 'Escanear'}
        </button>
        <button onClick={stopScanner} className="px-4 py-2 bg-red-600 text-white rounded">
          Detener
        </button>
      </div>

      {state.error && <p className="text-red-500 mt-2">{state.error}</p>}
    </div>
  );
}
```

### 2. Escaneo Estático (Subida de Archivos)

Si el usuario prefiere subir una foto de su galería (especialmente útil para códigos arrugados o dañados), usa el motor independiente `scanImageFile`.

```tsx
import { scanImageFile } from 'vertice-code-scanner/core';

export function EscanerPorArchivo() {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await scanImageFile(file);
      
      if (result) {
        alert(`Código: ${result.rawValue} (Motor: ${result.engineUsed})`);
      } else {
        alert('No se detectó ningún código válido en la imagen tras 3 pases de visión computacional.');
      }
    } catch (error) {
      console.error("Fallo crítico:", error);
    }
  };

  return (
    <input 
      type="file" 
      accept="image/*" 
      capture="environment" // Abre la cámara nativa en móviles
      onChange={handleUpload} 
      className="p-2 border rounded"
    />
  );
}
```

## 🧠 Arquitectura Interna (Computer Vision)

Para imágenes estáticas estropeadas, el motor ejecuta el siguiente pipeline interno transparente para el desarrollador:

1. **Pase Nativo:** `ZXing Wasm` puro (Normal e invertido).
2. **Pase de Sombras:** `OpenCV Adaptive Gaussian Threshold` para neutralizar papel arrugado y sombras asimétricas.
3. **Pase de Alto Contraste:** `OpenCV Otsu` estricto para mitigar rayones de bolígrafo oscuros.

Todo esto en ~300ms.
