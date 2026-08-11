'use client';
import { useState } from 'react';
import { BackButton } from '@/components/BackButton';

export default function SettingsProfile() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in space-y-6">
      <BackButton label="Back to Dashboard" href="/dashboard" className="mb-2" />
      <div className="mb-6">
        <h1 className="heading-display text-3xl font-bold text-primary mb-1">Settings & Profile</h1>
        <p className="text-textmuted text-sm">Manage your account, organization, and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {['profile', 'organization', 'notifications'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-textmuted hover:bg-bgbase hover:text-primary'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 card-premium p-8 min-h-[400px]">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in max-w-lg">
              <h2 className="text-xl font-bold text-primary mb-4 border-b border-bordercolor pb-4">Account Profile</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-textmuted uppercase mb-1">Full Name</label>
                  <input type="text" defaultValue="Admin User" className="w-full bg-bgbase border border-bordercolor rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-secondary transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-textmuted uppercase mb-1">Email Address</label>
                  <input type="email" defaultValue="admin@example.com" disabled className="w-full bg-surface border border-bordercolor rounded-lg px-4 py-2 text-textmuted cursor-not-allowed" />
                </div>
                <button className="btn-primary px-6 py-2">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-4 border-b border-bordercolor pb-4">
                <h2 className="text-xl font-bold text-primary">Organization Management</h2>
                <button className="btn-secondary px-4 py-1.5 text-sm">Invite Member</button>
              </div>
              <p className="text-sm text-textmuted mb-6">Manage members, roles, and connected repositories for <span className="font-bold text-primary">Acme Corp</span>.</p>
              
              <div className="bg-bgbase border border-bordercolor rounded-lg p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-primary">Admin User</div>
                    <div className="text-xs text-textmuted">admin@example.com</div>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">Owner</span>
                </div>
                <div className="h-px bg-bordercolor"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-primary">Developer 1</div>
                    <div className="text-xs text-textmuted">dev@example.com</div>
                  </div>
                  <span className="px-3 py-1 bg-surface text-textmuted text-xs font-bold rounded-full border border-bordercolor">Member</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-fade-in max-w-lg">
              <h2 className="text-xl font-bold text-primary mb-4 border-b border-bordercolor pb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-6 bg-bordercolor peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                  </div>
                  <span className="text-sm font-medium text-primary group-hover:text-secondary transition-colors">Email me when Analysis completes</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-10 h-6 bg-bordercolor peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                  </div>
                  <span className="text-sm font-medium text-primary group-hover:text-secondary transition-colors">Email me for Security/Logic Gap Alerts</span>
                </label>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
