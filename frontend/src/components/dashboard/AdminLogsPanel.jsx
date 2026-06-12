import React from 'react';
import { Shield } from 'lucide-react';

const AdminLogsPanel = ({ logs, loading }) => {
  return (
    <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 text-left rounded-2xl">
      <h3 className="text-base font-bold text-slate-800 font-serif mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-red-500" />
        <span>System Audit Logs</span>
      </h3>
      {loading ? (
        <div className="text-center py-8 text-xs text-slate-400 italic">Fetching system audit logs...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-72 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-[10px] uppercase tracking-wider font-extrabold">
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4 border-l border-slate-100">Entity</th>
                <th className="py-2.5 px-4 border-l border-slate-100">Details</th>
                <th className="py-2.5 px-4 border-l border-slate-100">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/30">
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-750 font-bold text-[9px] rounded-lg">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-l border-slate-100 font-bold text-slate-800">{log.entity}</td>
                  <td className="py-3 px-4 border-l border-slate-100 text-slate-600 font-medium">{log.details}</td>
                  <td className="py-3 px-4 border-l border-slate-100 text-slate-400 font-medium">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


export default AdminLogsPanel;
