import { useState } from 'react';
import axios from 'axios';
import ResultCard from './ResultCard';

export default function SingleLookup() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await axios.post('/api/lookup', { name: name.trim(), address: address.trim() });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="glass p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-5">Owner Lookup</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Owner Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Property Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, ST 12345"
                className="input-field"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Searching...
              </span>
            ) : (
              'Search Contacts'
            )}
          </button>
        </form>
      </div>

      {result && <ResultCard result={result} name={name} address={address} />}
    </div>
  );
}
