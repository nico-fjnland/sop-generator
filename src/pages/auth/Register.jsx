import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Spinner } from '../../components/ui/spinner';
import { 
  UserPlus, 
  ArrowLeft, 
  ArrowRight, 
  Envelope, 
  Lock, 
  User, 
  Briefcase,
  Buildings,
  UsersThree,
  Globe,
  MapPin,
  CheckCircle,
  Eye,
  EyeSlash
} from '@phosphor-icons/react';

// Step-Konfiguration
const STEPS = [
  { id: 1, title: 'Account' },
  { id: 2, title: 'Persönlich' },
  { id: 3, title: 'Organisation' },
];

// Kompakter StepIndicator am unteren Rand
const StepIndicator = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        
        return (
          <React.Fragment key={step.id}>
            {/* Dot */}
            <div 
              className={`
                flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                transition-all duration-300 ease-out
                ${isCompleted 
                  ? 'bg-primary text-white' 
                  : isCurrent 
                    ? 'bg-primary text-white ring-4 ring-primary/20' 
                    : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {isCompleted ? (
                <CheckCircle size={14} weight="bold" />
              ) : (
                step.id
              )}
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div 
                className={`w-8 h-0.5 transition-colors duration-300 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Step 1: Account Daten
const Step1Account = ({ formData, setFormData, errors }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail Adresse</Label>
        <div className="relative">
          <Envelope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@beispiel.de"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <div className="relative">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Mindestens 6 Zeichen"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
        <div className="relative">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Passwort wiederholen"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
      </div>
    </div>
  );
};

// Step 2: Persönliche Daten
const Step2Personal = ({ formData, setFormData, errors }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Vorname</Label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              id="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Max"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Nachname</Label>
          <Input
            id="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Mustermann"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobPosition">Position / Rolle</Label>
        <div className="relative">
          <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            id="jobPosition"
            type="text"
            placeholder="z.B. Oberarzt, Stationsleitung, etc."
            value={formData.jobPosition}
            onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-gray-400">Optional – hilft uns, das Erlebnis zu personalisieren</p>
      </div>
    </div>
  );
};

// Step 3: Organisationsdaten
const Step3Organization = ({ formData, setFormData, errors }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hospitalName">Name der Einrichtung</Label>
        <div className="relative">
          <Buildings size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            id="hospitalName"
            type="text"
            placeholder="z.B. Universitätsklinikum Berlin"
            value={formData.hospitalName}
            onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hospitalEmployees">Anzahl Mitarbeitende</Label>
          <div className="relative">
            <UsersThree size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              id="hospitalEmployees"
              type="text"
              placeholder="z.B. 500"
              value={formData.hospitalEmployees}
              onChange={(e) => setFormData({ ...formData, hospitalEmployees: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hospitalWebsite">Webseite</Label>
          <div className="relative">
            <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              id="hospitalWebsite"
              type="url"
              placeholder="https://..."
              value={formData.hospitalWebsite}
              onChange={(e) => setFormData({ ...formData, hospitalWebsite: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hospitalAddress">Adresse</Label>
        <div className="relative">
          <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
          <textarea
            id="hospitalAddress"
            placeholder="Straße, PLZ Ort"
            value={formData.hospitalAddress}
            onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            rows={2}
          />
        </div>
        <p className="text-xs text-gray-400">Alle Felder in diesem Schritt sind optional</p>
      </div>
    </div>
  );
};

// Success Screen
const SuccessScreen = () => {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
        <CheckCircle size={48} className="text-green-600" weight="fill" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Registrierung erfolgreich!</h3>
      <p className="text-gray-600 mb-6">
        Wir haben dir eine Bestätigungs-E-Mail gesendet.<br />
        Bitte überprüfe dein Postfach und klicke auf den Bestätigungslink.
      </p>
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>Tipp:</strong> Schaue auch im Spam-Ordner nach, falls du die E-Mail nicht findest.
        </p>
      </div>
    </div>
  );
};

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    jobPosition: '',
    hospitalName: '',
    hospitalEmployees: '',
    hospitalWebsite: '',
    hospitalAddress: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const { signUp } = useAuth();

  // Validierung für Step 1
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Bitte gib eine gültige E-Mail-Adresse ein';
    }
    
    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Passwort muss mindestens 6 Zeichen lang sein';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep < STEPS.length) {
      handleNext();
      return;
    }

    try {
      setGlobalError('');
      setLoading(true);
      
      // 1. User registrieren
      const { data: authData, error: authError } = await signUp(formData.email, formData.password);
      
      if (authError) throw authError;
      
      // 2. Profil-Daten speichern (falls User erstellt wurde)
      if (authData?.user) {
        const profileData = {
          id: authData.user.id,
          first_name: formData.firstName || null,
          last_name: formData.lastName || null,
          job_position: formData.jobPosition || null,
          hospital_name: formData.hospitalName || null,
          hospital_employees: formData.hospitalEmployees || null,
          hospital_address: formData.hospitalAddress || null,
          hospital_website: formData.hospitalWebsite || null,
          updated_at: new Date().toISOString(),
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData);
        
        if (profileError) {
          console.error('Profile update error:', profileError);
          // Nicht blockierend - User ist trotzdem registriert
        }
      }
      
      setIsComplete(true);
      
    } catch (error) {
      setGlobalError('Fehler bei der Registrierung: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Account formData={formData} setFormData={setFormData} errors={errors} />;
      case 2:
        return <Step2Personal formData={formData} setFormData={setFormData} errors={errors} />;
      case 3:
        return <Step3Organization formData={formData} setFormData={setFormData} errors={errors} />;
      default:
        return null;
    }
  };

  // Success State
  if (isComplete) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-sm border border-border">
          <SuccessScreen />
          <div className="mt-6 space-y-3">
            <Button
              onClick={() => { window.location.href = '/login'; }}
              className="w-full h-11 gap-2 rounded-lg"
            >
              Zur Anmeldung
            </Button>
            <Button
              variant="outline"
              onClick={() => { window.location.href = '/'; }}
              className="w-full h-11 gap-2 rounded-lg"
            >
              <ArrowLeft size={18} />
              Zurück zum Editor
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-lg shadow-sm border border-border">
        {/* Header - wie bei Login */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Konto erstellen
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Oder{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/90">
              melde dich an
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Global Error */}
          {globalError && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline text-sm">{globalError}</span>
            </div>
          )}

          {/* Step Content with Animation */}
          <div 
            key={currentStep}
            className="animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="space-y-3">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-11 gap-2 rounded-lg"
                  disabled={loading}
                >
                  <ArrowLeft size={18} />
                  Zurück
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 gap-2 rounded-lg shadow-sm text-sm font-medium"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Wird erstellt...</span>
                  </>
                ) : currentStep === STEPS.length ? (
                  <>
                    <UserPlus size={18} weight="bold" />
                    <span>Konto erstellen</span>
                  </>
                ) : (
                  <>
                    <span>Weiter</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </div>
            
            {/* Zurück zum Editor Button - in der Box */}
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

          {/* Step Indicator - kompakt am unteren Rand */}
          <div className="pt-4 border-t border-border">
            <StepIndicator currentStep={currentStep} steps={STEPS} />
            <p className="text-center text-xs text-muted-foreground mt-2">
              Schritt {currentStep} von {STEPS.length}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
