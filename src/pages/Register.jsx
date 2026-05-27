import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Library, Mail, Lock, Eye, EyeOff, User, Hash, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    name:      '',
    email:     '',
    studentId: '',
    password:  '',
    confirm:   '',
  });
  const [showPw,   setShowPw]   = useState(false);
  const [showCfm,  setShowCfm]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())    errs.name     = 'Full name is required';
    if (!form.email.trim())   errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 8)  errs.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must include an uppercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must include a number';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      await register(form.name.trim(), form.email.trim(), form.password, form.studentId.trim() || undefined);
      navigate('/main/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-root">
      <div className="login-card" style={{ maxWidth: '480px' }}>

        {/* Branding */}
        <div className="login-brand-header">
          <div className="login-brand-icon">
            <Library size={28} />
          </div>
          <div>
            <h1 className="login-brand-title">Books Repository</h1>
            <p className="login-brand-subtitle">
              <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Create your student account
            </p>
          </div>
        </div>

        {apiError && (
          <div className="login-error-banner" role="alert">{apiError}</div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>

          {/* Full Name */}
          <div className="login-field-group">
            <label htmlFor="name" className="login-field-label">Full name</label>
            <div className="login-input-wrapper">
              <User size={16} className="login-input-icon" />
              <input
                id="name"
                type="text"
                className={`login-input-field${errors.name ? ' input-error' : ''}`}
                placeholder="Juan dela Cruz"
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
                autoFocus
              />
            </div>
            {errors.name && <span className="field-error-text">{errors.name}</span>}
          </div>

          {/* Email */}
          <div className="login-field-group">
            <label htmlFor="email" className="login-field-label">Email address</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                id="email"
                type="email"
                className={`login-input-field${errors.email ? ' input-error' : ''}`}
                placeholder="you@university.edu"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="field-error-text">{errors.email}</span>}
          </div>

          {/* Student ID (optional) */}
          <div className="login-field-group">
            <label htmlFor="studentId" className="login-field-label">
              Student ID <span className="field-optional-tag">(optional)</span>
            </label>
            <div className="login-input-wrapper">
              <Hash size={16} className="login-input-icon" />
              <input
                id="studentId"
                type="text"
                className="login-input-field"
                placeholder="e.g. ST2024001"
                value={form.studentId}
                onChange={set('studentId')}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field-group">
            <label htmlFor="password" className="login-field-label">Password</label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className={`login-input-field${errors.password ? ' input-error' : ''}`}
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
              />
              <button type="button" className="login-pw-toggle" onClick={() => setShowPw(v => !v)} aria-label="Toggle password">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="field-error-text">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="login-field-group">
            <label htmlFor="confirm" className="login-field-label">Confirm password</label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                id="confirm"
                type={showCfm ? 'text' : 'password'}
                className={`login-input-field${errors.confirm ? ' input-error' : ''}`}
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
              />
              <button type="button" className="login-pw-toggle" onClick={() => setShowCfm(v => !v)} aria-label="Toggle confirm password">
                {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirm && <span className="field-error-text">{errors.confirm}</span>}
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="register-signin-link">
          Already have an account?{' '}
          <Link to="/login" className="register-link-accent">Sign in</Link>
        </p>

      </div>
    </div>
  );
}
