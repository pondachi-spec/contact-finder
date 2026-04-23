import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfidenceBadge from './ConfidenceBadge';

function PhoneRow({ phone, name, address }) {
  const [sending, setSending] = useState(false);

  async function sendToAlisha() {
    setSending(true);
    try {
      await axios.post('http://localhost:3000/api/webhook/propwire', {
        name,
        address,
        phone: phone.number,
        source: 'Contact Finder',
      });
      toast.success('Sent to Alisha!');
    } catch (err) {
      toast.error(`Failed to send: ${err.message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-slate-200 font-mono text-sm">{phone.number}</span>
        <ConfidenceBadge confidence={phone.confidence} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-600 text-xs hidden sm:block">
          {phone.sources?.join(', ')}
        </span>
        <button
          onClick={sendToAlisha}
          disabled={sending}
          className="text-xs px-3 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30
                     text-violet-300 transition-all duration-200 disabled:opacity-40 whitespace-nowrap"
        >
          {sending ? '...' : '→ Alisha'}
        </button>
      </div>
    </div>
  );
}

function EmailRow({ email }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-slate-200 text-sm">{email.address}</span>
      <ConfidenceBadge confidence={email.confidence} />
      <span className="text-slate-600 text-xs hidden sm:block ml-auto">{email.sources?.join(', ')}</span>
    </div>
  );
}

export default function ResultCard({ result, name, address }) {
  function downloadCSV() {
    const rows = [
      ['Type', 'Value', 'Confidence', 'Sources'],
      ...result.phones.map((p) => ['Phone', p.number, p.confidence, p.sources?.join('|')]),
      ...result.emails.map((e) => ['Email', e.address, e.confidence, e.sources?.join('|')]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${name.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="glass p-6 space-y-5 mt-6 animate-in fade-in duration-300">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-100">{name}</h3>
          <p className="text-slate-500 text-sm">{address}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {result.isMock && (
            <span className="text-xs px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              Mock Data
            </span>
          )}
          {result.cached && (
            <span className="text-xs px-2 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-400">
              Cached {result.cachedDaysAgo}d ago
            </span>
          )}
          <button onClick={downloadCSV} className="btn-ghost text-xs">
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Phone numbers */}
      {result.phones?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            📞 Phone Numbers
          </h4>
          <div className="glass-dark p-3">
            {result.phones.map((p, i) => (
              <PhoneRow key={i} phone={p} name={name} address={address} />
            ))}
          </div>
        </div>
      )}

      {/* Emails */}
      {result.emails?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            ✉ Email Addresses
          </h4>
          <div className="glass-dark p-3">
            {result.emails.map((e, i) => (
              <EmailRow key={i} email={e} />
            ))}
          </div>
        </div>
      )}

      {!result.phones?.length && !result.emails?.length && (
        <p className="text-slate-500 text-center py-4">No contact information found.</p>
      )}
    </div>
  );
}
