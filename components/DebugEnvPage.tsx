
import React, { useEffect, useState } from 'react';
import { getPublicConfig } from '../lib/publicEnv';

const DebugEnvPage: React.FC = () => {
  const [config, setConfig] = useState<{ googleMapsKey: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPublicConfig().then(cfg => {
      setConfig(cfg);
      setIsLoading(false);
    });
  }, []);

  const hasKey = !!config?.googleMapsKey && config.googleMapsKey.length > 10;
  const keyLength = config?.googleMapsKey?.length || 0;
  const keyPreview = hasKey 
    ? `${config!.googleMapsKey!.substring(0, 6)}...${config!.googleMapsKey!.substring(config!.googleMapsKey!.length - 4)}` 
    : "None";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 p-8 font-mono text-sm leading-relaxed">
      <div className="max-w-2xl mx-auto border border-slate-700 rounded-xl overflow-hidden shadow-2xl bg-slate-800">
        <div className="bg-slate-700 px-6 py-4 border-b border-slate-600">
          <h1 className="text-brand-teal font-bold text-lg">Runtime Environment Diagnostic</h1>
        </div>
        <div className="p-6 space-y-6">
          <section>
            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 border-b border-slate-700 pb-1">System Info</h2>
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-slate-500">Hostname:</span>
              <span>{window.location.hostname}</span>
              <span className="text-slate-500">Timestamp:</span>
              <span>{new Date().toISOString()}</span>
              <span className="text-slate-500">User Agent:</span>
              <span className="truncate" title={navigator.userAgent}>{navigator.userAgent}</span>
            </div>
          </section>

          <section>
            <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 border-b border-slate-700 pb-1">Google Maps Config (via /api/public-config)</h2>
            {isLoading ? (
              <p className="text-slate-500 italic">Fetching runtime config...</p>
            ) : (
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-slate-500">Key Found:</span>
                <span className={hasKey ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {hasKey ? "TRUE" : "FALSE"}
                </span>
                <span className="text-slate-500">Key Length:</span>
                <span>{keyLength} chars</span>
                <span className="text-slate-500">Key Preview:</span>
                <span>{keyPreview}</span>
              </div>
            )}
          </section>

          {!isLoading && !hasKey && (
            <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg">
              <p className="text-red-200 font-bold mb-2">Critical: Environment Variable Missing</p>
              <ol className="list-decimal list-inside space-y-1 text-red-300 text-xs leading-relaxed">
                <li>Go to Vercel Dashboard Settings</li>
                <li>Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (and optionally GOOGLE_MAPS_API_KEY)</li>
                <li>Assign to Production, Preview, and Development</li>
                <li><strong>IMPORTANT:</strong> Trigger a new manual redeploy of your branch</li>
              </ol>
            </div>
          )}

          <div className="pt-4 flex justify-between items-center">
            <a href="/" className="text-brand-teal hover:underline text-xs">← Back to Scheduler</a>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-xs font-bold transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugEnvPage;
