import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Library, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/main/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-root">
      <div className="login-card">

        {/* Branding */}
        <div className="login-brand-header">
          <div className="login-brand-icon">
            <Library size={28} />
          </div>
          <div>
            <h1 className="login-brand-title">Books Repository</h1>
            <p className="login-brand-subtitle">
              <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Intelligent Library Management
            </p>
          </div>
        </div>

        <div className="login-form-section">
          <h2 className="login-form-heading">Sign in to your account</h2>
          <p className="login-form-subtext">Enter your credentials to continue</p>
        </div>

        {error && (
          <div className="login-error-banner" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field-group">
            <label htmlFor="email" className="login-field-label">Email address</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                id="email"
                type="email"
                className="login-input-field"
                placeholder="you@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="login-field-group">
            <label htmlFor="password" className="login-field-label">Password</label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="login-input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="register-signin-link">
          New student?{' '}
          <Link to="/register" className="register-link-accent">Create an account</Link>
        </p>

      </div>
    </div>
  );
}
