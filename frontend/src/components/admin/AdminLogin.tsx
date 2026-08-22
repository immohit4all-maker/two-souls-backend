import { useState } from 'react';
import { useAuth } from '../../context/auth-context';
import { Button } from '../ui/Button';
import { Field, TextInput } from '../ui/Field';
import { Icon } from '../ui/Icon';

export function AdminLogin() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await login(username, password);

    // Only clear the pending state on failure — on success this component unmounts as the
    // portal swaps in, and setting state afterwards would be a no-op warning.
    if (!result.success) {
      setError(result.message ?? 'Invalid username or password.');
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      {/* No "back to shop" link: this is a private console, not a page customers should ever
          find their way in or out of. */}
      <div className="login-card">
        <div className="login-brand">
          <span className="login-mark">
            <Icon name="sparkle" size={20} filled />
          </span>
          <h1 className="login-title">Two Souls Console</h1>
          <p className="login-sub">Private business administration. Authorised access only.</p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <Icon name="alert" size={17} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <Field label="Username" required>
            <TextInput
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </Field>

          <Field label="Password" required>
            <TextInput
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••••"
              required
            />
          </Field>

          <Button type="submit" size="lg" fullWidth loading={submitting} iconLeft="lock">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
