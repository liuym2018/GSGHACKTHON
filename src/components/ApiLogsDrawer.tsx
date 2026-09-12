import React, { useState, useEffect } from 'react';
import { ApiLogItem } from '../types';
import {
  Activity,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  ChevronRight,
  Code,
} from 'lucide-react';

interface ApiLogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiLogsDrawer: React.FC<ApiLogsDrawerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ApiLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'VIDEO' | 'SMS_VERIFY'>('ALL');
  const [selectedLog, setSelectedLog] = useState<ApiLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vonage/logs');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Failed to load logs', e);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      await fetch('/api/vonage/logs/clear', { method: 'POST' });
      setLogs([]);
      setSelectedLog(null);
    } catch (e) {
      console.error('Failed to clear logs', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.service === filter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-neutral-900 h-full border-l border-neutral-800 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Vonage Network & Audit Logs
              </h3>
              <p className="text-[11px] text-neutral-400">
                Real-time API session events, SMS requests, and OTP validations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={clearLogs}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-900/60 text-neutral-300 hover:text-red-300 transition cursor-pointer"
              title="Clear all logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer ml-1"
            >
              Close
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-950/50 border-b border-neutral-800 text-xs">
          <span className="text-neutral-500 font-medium">Filter:</span>
          {(['ALL', 'VIDEO', 'SMS_VERIFY'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {f === 'SMS_VERIFY' ? 'SMS Verify' : f}
            </button>
          ))}
          <span className="ml-auto text-neutral-500 text-[11px] font-mono">
            {filteredLogs.length} events
          </span>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/80 p-2">
          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-neutral-500 text-xs">
              No API events logged yet. Trigger a video call or send an SMS code to inspect requests.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(isSelected ? null : log)}
                  className={`p-3 rounded-xl transition cursor-pointer my-1 ${
                    isSelected
                      ? 'bg-neutral-800 border border-neutral-700'
                      : 'hover:bg-neutral-850 bg-neutral-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {log.status === 'SUCCESS' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                      {log.status === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      {log.status === 'ERROR' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                      {log.status === 'INFO' && <Info className="w-3.5 h-3.5 text-blue-400" />}

                      <span
                        className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${
                          log.service === 'VIDEO'
                            ? 'bg-purple-950 text-purple-300'
                            : 'bg-blue-950 text-blue-300'
                        }`}
                      >
                        {log.service}
                      </span>
                    </div>

                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-neutral-200 mb-1">
                    {log.action}
                  </div>

                  {/* Expanded Payload Inspector */}
                  {isSelected && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto">
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-1">
                        <Code className="w-3 h-3 text-blue-400" />
                        <span>Payload & Telemetry:</span>
                      </div>
                      <pre className="text-emerald-400">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
