'use client';
import { useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);
      localStorage.setItem('email', data.email);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center px-4 animate-fade-in">
      <div className="card-premium max-w-md w-full p-10">
        <h1 className="heading-display text-3xl font-bold text-center mb-2 text-primary">Welcome Back</h1>
        <p className="text-center text-textmuted mb-8 text-sm">Sign in to continue to CodeAtlas</p>
        
        {error && <div className="bg-error/10 text-error p-3 rounded-md mb-6 text-sm font-medium border border-error/20">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-md border border-bordercolor focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition bg-bgbase text-textmain" placeholder="you@example.com" disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-md border border-bordercolor focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition bg-bgbase text-textmain" placeholder="••••••••" disabled={loading} />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-3 mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
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
          Don&apos;t have an account? <Link href="/register" className="text-secondary font-semibold hover:underline transition">Register</Link>
        </p>
      </div>
    </div>
  );
}
