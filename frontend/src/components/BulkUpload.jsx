import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfidenceBadge from './ConfidenceBadge';

const API = '/api/bulk';

export default function BulkUpload() {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null); // pending|processing|completed|failed
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const pollRef = useRef(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling(id) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API}/status/${id}`);
        setStatus(data.status);
        setProgress({ processed: data.processedRecords, total: data.totalRecords });
        if (data.status === 'completed' || data.status === 'failed') {
          stopPolling();
          if (data.status === 'completed') toast.success('Processing complete!');
          if (data.status === 'failed') {
            toast.error('Processing failed');
            setError(data.error || 'Unknown error');
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 1000);
  }

  const onDrop = useCallback(async (accepted) => {
    const file = accepted[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    setJobId(null);
    setStatus(null);
    setProgress({ processed: 0, total: 0 });
    setUploading(true);

    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await axios.post(`${API}/upload`, form);
      setJobId(data.jobId);
      setProgress({ processed: 0, total: data.totalRecords });
      setStatus('processing');
      startPolling(data.jobId);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: uploading || status === 'processing',
  });

  const pct = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;

  function downloadResults() {
    window.open(`${API}/download/${jobId}`, '_blank');
  }

  function reset() {
    stopPolling();
    setJobId(null);
    setStatus(null);
    setProgress({ processed: 0, total: 0 });
    setError('');
    setFileName('');
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div className="glass p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-2">Bulk CSV Upload</h2>
        <p className="text-slate-500 text-sm mb-5">
          CSV must have <code className="text-indigo-400">name</code> and{' '}
          <code className="text-indigo-400">address</code> columns. Processed in batches of 10.
        </p>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          } ${(uploading || status === 'processing') ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="text-4xl mb-3">{isDragActive ? '📂' : '📁'}</div>
          {fileName ? (
            <p className="text-slate-300 font-medium">{fileName}</p>
          ) : (
            <>
              <p className="text-slate-300 font-medium">Drop your CSV here</p>
              <p className="text-slate-600 text-sm mt-1">or click to browse</p>
            </>
          )}
        </div>

        {/* CSV format hint */}
        <div className="mt-4 glass-dark p-3 text-xs text-slate-500 font-mono">
          name,address<br />
          John Smith,"123 Main St, Austin TX 78701"<br />
          Jane Doe,"456 Oak Ave, Dallas TX 75201"
        </div>
      </div>

      {/* Progress */}
      {(status === 'processing' || status === 'pending') && (
        <div className="glass p-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300 font-medium">Processing records…</span>
            <span className="text-slate-400">
              {progress.processed} / {progress.total}
            </span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs">{pct}% complete · Processing in batches of 10</p>
        </div>
      )}

      {/* Completed */}
      {status === 'completed' && (
        <div className="glass p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-slate-200">
                Completed — {progress.total} records processed
              </p>
              <p className="text-slate-500 text-sm">Results are ready to download</p>
            </div>
          </div>

          {/* Full progress bar green */}
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full" />
          </div>

          <div className="flex gap-3 flex-wrap">
            <button onClick={downloadResults} className="btn-primary">
              ⬇ Download CSV
            </button>
            <button onClick={reset} className="btn-ghost">
              New Upload
            </button>
          </div>
        </div>
      )}

      {/* Failed */}
      {status === 'failed' && (
        <div className="glass p-6 border border-red-500/20">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">❌</span>
            <p className="font-semibold text-red-300">Processing Failed</p>
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button onClick={reset} className="btn-ghost">Try Again</button>
        </div>
      )}

      {error && !status && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Confidence legend */}
      <div className="glass p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Confidence Score Guide
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <ConfidenceBadge confidence="HIGH" />
            <span className="text-slate-400">Same number confirmed by 2+ sources</span>
          </div>
          <div className="flex items-center gap-3">
            <ConfidenceBadge confidence="MEDIUM" />
            <span className="text-slate-400">Found in 1 source, data less than 1 year old</span>
          </div>
          <div className="flex items-center gap-3">
            <ConfidenceBadge confidence="LOW" />
            <span className="text-slate-400">Found in 1 source, data older than 1 year</span>
          </div>
        </div>
      </div>
    </div>
  );
}
