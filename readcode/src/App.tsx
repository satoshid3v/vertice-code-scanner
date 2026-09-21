import { useState, useRef } from 'react';
import { ScannerModal } from './components/ScannerModal';
import type { VerticeScanResult } from './core/scannerEngine';
import { scanImageFile } from './core/fileScanner';
import { Upload, Camera, Loader2, AlertCircle } from 'lucide-react';

function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastResult, setLastResult] = useState<VerticeScanResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setFileError(null);
    try {
      const result = await scanImageFile(file);
      if (result) {
        setLastResult(result);
      } else {
        setFileError("No se detectó ningún código válido en la imagen.");
      }
    } catch (error: any) {
      setFileError(error.message || "Error procesando la imagen.");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Vertice Code</h1>
        <p className="text-slate-400 mb-8 text-sm">Next-Gen Barcode Engine</p>

        {lastResult && (
          <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Última Lectura</p>
            <p className="text-lg font-mono text-white break-all">{lastResult.rawValue}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-white/10 rounded-md text-xs font-medium text-slate-300">
                {lastResult.format.toUpperCase()}
              </span>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md text-xs font-medium">
                {lastResult.engineUsed === 'native_barcode_detector' ? 'NPU Native' : 'Wasm'}
              </span>
            </div>
          </div>
        )}

        {fileError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{fileError}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-950 font-semibold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98]"
          >
            <Camera className="w-5 h-5" />
            Escanear con Cámara
          </button>

          <div className="relative">
            <input 
              type="file" 
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile}
              className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white font-medium py-4 rounded-xl hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingFile ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              {isProcessingFile ? "Analizando Imagen..." : "Subir Imagen (.jpg, .png)"}
            </button>
          </div>
        </div>
      </div>

      <ScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onResult={(res) => {
          setLastResult(res);
          setIsScannerOpen(false);
        }}
      />
    </div>
  );
}

export default App;
