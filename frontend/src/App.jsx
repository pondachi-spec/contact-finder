import { useState } from 'react';
import Header from './components/Header';
import SingleLookup from './components/SingleLookup';
import BulkUpload from './components/BulkUpload';

const TABS = [
  { id: 'single', label: 'Single Lookup', icon: '🔍' },
  { id: 'bulk', label: 'Bulk Upload', icon: '📋' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('single');

  return (
    <div className="min-h-screen bg-[#080818] relative overflow-x-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-900/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-violet-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        <Header />

        {/* Tab bar */}
        <div className="flex gap-2 mb-8 glass p-1.5 w-fit rounded-2xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'single' && <SingleLookup />}
        {activeTab === 'bulk' && <BulkUpload />}
      </div>
    </div>
  );
}
