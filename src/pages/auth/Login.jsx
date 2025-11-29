import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { SignIn, ArrowLeft } from '@phosphor-icons/react';
import { Spinner } from '../../components/ui/spinner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const { error } = await signIn(email, password);
      if (error) throw error;
      window.location.href = '/';
    } catch (error) {
      setError('Fehler beim Anmelden: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-lg shadow-sm border border-border">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Anmelden
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Oder{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary/90">
              erstelle ein neues Konto
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-address">Email Adresse</Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 gap-2 rounded-lg shadow-sm text-sm font-medium"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>Anmelden...</span>
                </>
              ) : (
                <>
                  <SignIn size={18} weight="bold" />
                  <span>Anmelden</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 gap-2 rounded-lg text-sm font-medium"
              onClick={() => { window.location.href = '/'; }}
            >
              <ArrowLeft size={18} />
              <span>Zurück zum Editor</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
