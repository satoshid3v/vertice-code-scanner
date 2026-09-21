// Entry point público de la librería vertice-code-scanner
export { useVerticeScanner } from './hooks/useVerticeScanner';
export { scanImageFile } from './core/fileScanner';

// Exportando tipos estrictos para los desarrolladores consumidores
export type { 
    VerticeScannerConfig, 
    VerticeScannerState, 
    VerticeScanResult, 
    VerticeBarcodeFormat 
} from './core/scannerEngine';
