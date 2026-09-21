/**
 * @author Vertice Code
 * @description VerticeScanner Engine - Core Interfaces & Types
 */

export type VerticeBarcodeFormat = 
  | 'code_128' 
  | 'ean_13' 
  | 'upc_a' 
  | 'qr_code';

export interface VerticeScannerConfig {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  formats: VerticeBarcodeFormat[];
  confidenceThreshold?: number;
  cropZoneRatio?: number;
  onDetect: (result: VerticeScanResult) => void;
  onError?: (error: Error) => void;
}

export interface VerticeScanResult {
  rawValue: string;
  format: VerticeBarcodeFormat;
  timestamp: number;
  engineUsed: 'native_barcode_detector' | 'wasm_fallback';
}

export interface VerticeScannerState {
  isInitializing: boolean;
  isScanning: boolean;
  hasCameraPermission: boolean;
  activeEngine: 'native_barcode_detector' | 'wasm_fallback' | 'none';
  error: string | null;
}
