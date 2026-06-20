import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await signup(email, password, name);
        if (signUpError) throw signUpError;
        setMessage('Registration successful! Check your email for a confirmation link.');
      } else {
        const { error: loginError } = await login(email, password);
        if (loginError) throw loginError;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your workspace' : 'Welcome back to KahwinGo'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Start planning your wedding journey' : 'Manage your wedding targets together'}
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm border border-emerald-100">
              {message}
            </div>
          )}

          <div className="rounded-md space-y-3">
            {isSignUp && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Your Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Amira / Farhan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Email address</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="couple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Password</label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Processing...' : isSignUp ? 'Register Account' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
            className="text-sm text-emerald-600 hover:underline font-medium cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account yet? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}