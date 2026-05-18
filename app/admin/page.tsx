import { adminDb } from '@/lib/firebase-admin';
import { Lead } from '@/types';
import { Zap, Clock, CheckCircle2, FileText, Send, AlertCircle, RefreshCw } from 'lucide-react';

// Force dynamic rendering since we are fetching live data from Firestore
export const dynamic = 'force-dynamic';

function getStatusBadge(status: string) {
  const styles: Record<string, { bg: string, text: string, icon: any }> = {
    PROCESSING: { bg: 'bg-slate-500/10', text: 'text-slate-400', icon: Clock },
    SCRAPING: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: RefreshCw },
    GENERATING_REPORT: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', icon: Zap },
    PDF_CREATED: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: FileText },
    EMAILED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: Send },
    FAILED: { bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertCircle },
  };

  const style = styles[status] || styles.PROCESSING;
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}

export default async function AdminDashboard() {
  let leads: Lead[] = [];
  try {
    const snapshot = await adminDb.collection('leads').orderBy('createdAt', 'desc').get();
    leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
  } catch (error) {
    console.error('Failed to fetch leads:', error);
  }

  const successCount = leads.filter(l => l.status === 'EMAILED').length;
  const processingCount = leads.filter(l => !['EMAILED', 'FAILED'].includes(l.status)).length;
  const failedCount = leads.filter(l => l.status === 'FAILED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">Manage and track your AI lead generations.</p>
          </div>
          <a href="/" className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700">
            &larr; Back to Landing Page
          </a>
        </header>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-slate-400 text-sm font-medium mb-1">Total Leads</h3>
            <p className="text-3xl font-bold text-white">{leads.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-slate-400 text-sm font-medium mb-1">Successfully Emailed</h3>
            <p className="text-3xl font-bold text-emerald-400">{successCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-slate-400 text-sm font-medium mb-1">Processing</h3>
            <p className="text-3xl font-bold text-blue-400">{processingCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-slate-400 text-sm font-medium mb-1">Failed</h3>
            <p className="text-3xl font-bold text-red-400">{failedCount}</p>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-800/50 text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{lead.company}</div>
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          {lead.website}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300">{lead.name}</div>
                        <div className="text-xs">{lead.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString()}
                        <div className="text-xs">{new Date(lead.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {lead.pdfUrl ? (
                          <a 
                            href={lead.pdfUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-xs font-medium"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View PDF
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
