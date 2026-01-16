import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { SignIn, ArrowLeft, Envelope, Lock, Eye, EyeSlash, ShieldWarning } from '@phosphor-icons/react';
import { Spinner } from '../../components/ui/spinner';
import AnimatedGradient from '../../components/fancy/background/animated-gradient-with-svg';
import './Login.css';

// Übersetzung der Supabase-Fehlermeldungen
const translateAuthError = (message) => {
  const translations = {
    'Invalid login credentials': 'Bitte prüfe deine Anmeldedaten erneut.',
    'Email not confirmed': 'Bitte bestätige zuerst deine E-Mail-Adresse.',
    'User not found': 'Kein Konto mit dieser E-Mail-Adresse gefunden.',
    'Invalid email or password': 'Bitte prüfe deine Anmeldedaten erneut.',
    'Too many requests': 'Zu viele Anmeldeversuche. Bitte warte einen Moment.',
    'Network request failed': 'Netzwerkfehler. Bitte prüfe deine Internetverbindung.',
  };
  
  // Suche nach passender Übersetzung (auch Teilstring-Match)
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return message; // Fallback auf Original
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const { signIn } = useAuth();
  // Navigation handled by App.js after successful login
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for timeout reason in URL
  useEffect(() => {
    if (searchParams.get('reason') === 'timeout') {
      setShowTimeoutMessage(true);
      // Remove the query parameter from URL to prevent showing again on refresh
      searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const { error } = await signIn(email, password);
      if (error) throw error;
      window.location.href = '/';
    } catch (error) {
      setError('Fehler beim Anmelden: ' + translateAuthError(error.message));
    } finally {
      setLoading(false);
    }
  };

  // Yellow/Amber gradient colors for timeout warning (matching StatusIndicator)
  const timeoutGradientColors = ['#FAAD14', '#FFCC5C', '#FAAD14'];

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className={`login-wrapper ${showTimeoutMessage ? 'with-timeout' : ''}`}>
        {/* Animated gradient frame for timeout message */}
        {showTimeoutMessage && (
          <div className="login-timeout-frame">
            <div className="login-gradient-container">
              <AnimatedGradient 
                colors={timeoutGradientColors}
                speed={8}
                blur="medium"
              />
            </div>
            <div className="login-timeout-header">
              <ShieldWarning size={18} weight="bold" className="login-timeout-icon" />
              <span className="login-timeout-text">
                Die Sitzung wurde aus Sicherheitsgründen aufgrund von Inaktivität abgemeldet. Der aktuelle Stand wurde im Browser zwischengespeichert. Logge dich erneut ein, um fortzufahren.
              </span>
            </div>
          </div>
        )}
        
        {/* Login card content */}
        <div className="login-card w-full max-w-md space-y-8 bg-card p-8 rounded-lg shadow-sm border border-border">
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
                <Label htmlFor="email-address">E-Mail Adresse</Label>
                <div className="relative">
                  <Envelope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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
    </div>
  );
}
