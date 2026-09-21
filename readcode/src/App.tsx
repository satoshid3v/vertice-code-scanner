import { useState } from 'react';
import { ScannerModal } from './components/ScannerModal';
import { VerticeScanResult } from './core/scannerEngine';

function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastResult, setLastResult] = useState<VerticeScanResult | null>(null);

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

        <button 
          onClick={() => setIsScannerOpen(true)}
          className="w-full bg-white text-slate-950 font-semibold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98]"
        >
          Iniciar Escáner
        </button>
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
