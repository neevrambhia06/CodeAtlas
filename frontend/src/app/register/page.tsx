'use client';
import { useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Developer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || password.length < 6) {
      setError('Name and Email are required, and password must be at least 6 characters.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Registration failed');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-76px)] flex items-center justify-center px-4 animate-fade-in">
        <div className="card-premium max-w-md w-full p-10 text-center">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 className="heading-display text-2xl font-bold text-primary mb-3">Registration Successful!</h2>
          <p className="text-textmuted mb-8">Your account has been created securely.</p>
          <Link href="/login" className="w-full btn-primary py-3">Proceed to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="card-premium max-w-md w-full p-10">
        <h1 className="heading-display text-3xl font-bold text-center mb-2 text-primary">Create Account</h1>
        <p className="text-center text-textmuted mb-8 text-sm">Join CodeAtlas to analyze your repositories</p>
        
        {error && <div className="bg-error/10 text-error p-3 rounded-md mb-6 text-sm font-medium border border-error/20">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-md border border-bordercolor focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition bg-bgbase text-textmain" placeholder="John Doe" disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-md border border-bordercolor focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition bg-bgbase text-textmain" placeholder="you@example.com" disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-md border border-bordercolor focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition bg-bgbase text-textmain" placeholder="Min 6 characters" disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-md border border-bordercolor focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition bg-bgbase text-textmain" placeholder="Confirm password" disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2.5 rounded-md border border-bordercolor focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition bg-bgbase text-textmain" disabled={loading}>
              <option value="Admin">Admin</option>
              <option value="Organization Owner">Organization Owner</option>
              <option value="Developer">Developer</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-3 mt-2">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="my-6 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-bordercolor after:mt-0.5 after:flex-1 after:border-t after:border-bordercolor">
          <p className="mx-4 mb-0 text-center text-sm text-textmuted font-medium">OR</p>
        </div>
        
        <button 
          onClick={() => window.location.href = `${API_BASE_URL}/auth/google/login`}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-medium py-2.5 px-4 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 shadow-sm transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-textmuted">
          Already have an account? <Link href="/login" className="text-secondary font-semibold hover:underline transition">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
