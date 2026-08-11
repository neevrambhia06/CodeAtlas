'use client';
import { useState } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="heading-display text-3xl font-bold text-primary mb-1">Admin Dashboard</h1>
          <p className="text-textmuted text-sm">System-wide monitoring and configuration.</p>
        </div>
        <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-secondary/10 text-secondary border border-secondary/20">
          Admin Role Active
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-bordercolor pb-4 mb-6">
        {['analytics', 'users', 'jobs', 'audit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${activeTab === tab ? 'bg-primary text-white' : 'text-textmuted hover:bg-bgbase hover:text-primary'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card-premium p-8 min-h-[400px]">
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-primary mb-4">KPI Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-bgbase p-6 rounded-xl border border-bordercolor shadow-sm">
                <div className="text-textmuted text-sm font-bold mb-2">Total Jobs Processed</div>
                <div className="text-3xl font-display font-bold text-primary">142</div>
              </div>
              <div className="bg-bgbase p-6 rounded-xl border border-bordercolor shadow-sm">
                <div className="text-textmuted text-sm font-bold mb-2">Active Users</div>
                <div className="text-3xl font-display font-bold text-primary">15</div>
              </div>
              <div className="bg-bgbase p-6 rounded-xl border border-bordercolor shadow-sm">
                <div className="text-textmuted text-sm font-bold mb-2">Avg Processing Time</div>
                <div className="text-3xl font-display font-bold text-primary">2.4m</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-primary mb-4">User Management</h2>
            <div className="bg-bgbase border border-bordercolor rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm text-textmuted">
                <thead className="bg-surface border-b border-bordercolor uppercase font-bold text-xs">
                  <tr><th className="px-6 py-4">User ID</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4 text-right">Action</th></tr>
                </thead>
                <tbody>
                  <tr className="border-b border-bordercolor hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-primary">u-1</td>
                    <td className="px-6 py-4">admin@example.com</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-secondary/10 text-secondary rounded text-xs font-bold">Admin</span></td>
                    <td className="px-6 py-4 text-right"><button className="text-secondary hover:underline">Edit Role</button></td>
                  </tr>
                  <tr className="hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-primary">u-2</td>
                    <td className="px-6 py-4">dev@example.com</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold">Developer</span></td>
                    <td className="px-6 py-4 text-right"><button className="text-secondary hover:underline">Edit Role</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="animate-fade-in text-center py-12">
            <span className="text-4xl mb-4 block">📈</span>
            <h3 className="text-lg font-bold text-primary mb-2">Cross-Org Job Monitoring</h3>
            <p className="text-textmuted text-sm">Monitor all repository parsings across the system.</p>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="animate-fade-in text-center py-12">
            <span className="text-4xl mb-4 block">📜</span>
            <h3 className="text-lg font-bold text-primary mb-2">Audit Logs Viewer</h3>
            <p className="text-textmuted text-sm">Track authentication, role changes, and system access.</p>
          </div>
        )}
      </div>
    </div>
  );
}
