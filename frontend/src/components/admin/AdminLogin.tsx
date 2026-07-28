import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await login(username, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.message || 'Invalid username or password');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 120px)',
      padding: '2rem 1rem'
    }}>
      <div className="card" style={{ width: '420px', maxWidth: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)'
          }}>
            ⚡ Admin Authentication
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Enter your administrative credentials to manage Two Souls marketplace.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontWeight: 600
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. admin"
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontSize: '0.95rem' }}
          >
            {submitting ? 'Authenticating...' : 'Sign In to Portal 🔒'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
