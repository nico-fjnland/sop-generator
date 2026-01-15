/**
 * Passwort-Policy nach BSI-Empfehlungen für den medizinischen Bereich
 * 
 * Anforderungen:
 * - Mindestens 12 Zeichen
 * - Mindestens ein Großbuchstabe
 * - Mindestens ein Kleinbuchstabe
 * - Mindestens eine Zahl
 * - Mindestens ein Sonderzeichen
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

/**
 * Liste der erlaubten Sonderzeichen für die Passwort-Policy
 */
export const SPECIAL_CHARACTERS = '!@#$%^&*(),.?":{}|<>_+-=[];\'/\\`~';

/**
 * Validiert ein Passwort gegen die Policy-Anforderungen
 * @param {string} password - Das zu validierende Passwort
 * @returns {{ isValid: boolean, errors: string[], checks: object }}
 */
export const validatePassword = (password) => {
  const errors = [];
  const checks = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  };

  if (!password) {
    return { 
      isValid: false, 
      errors: ['Passwort ist erforderlich'], 
      checks 
    };
  }

  // Mindestlänge prüfen
  if (password.length >= PASSWORD_REQUIREMENTS.minLength) {
    checks.minLength = true;
  } else {
    errors.push(`Mindestens ${PASSWORD_REQUIREMENTS.minLength} Zeichen`);
  }

  // Großbuchstabe prüfen
  if (/[A-Z]/.test(password)) {
    checks.hasUppercase = true;
  } else if (PASSWORD_REQUIREMENTS.requireUppercase) {
    errors.push('Mindestens ein Großbuchstabe');
  }

  // Kleinbuchstabe prüfen
  if (/[a-z]/.test(password)) {
    checks.hasLowercase = true;
  } else if (PASSWORD_REQUIREMENTS.requireLowercase) {
    errors.push('Mindestens ein Kleinbuchstabe');
  }

  // Zahl prüfen
  if (/[0-9]/.test(password)) {
    checks.hasNumber = true;
  } else if (PASSWORD_REQUIREMENTS.requireNumber) {
    errors.push('Mindestens eine Zahl');
  }

  // Sonderzeichen prüfen
  if (/[!@#$%^&*(),.?":{}|<>_+\-=[\];'/\\`~]/.test(password)) {
    checks.hasSpecial = true;
  } else if (PASSWORD_REQUIREMENTS.requireSpecial) {
    errors.push('Mindestens ein Sonderzeichen');
  }

  return {
    isValid: errors.length === 0,
    errors,
    checks,
  };
};

/**
 * Berechnet die Passwortstärke als Prozentwert (0-100)
 * @param {string} password - Das zu bewertende Passwort
 * @returns {{ score: number, label: string, color: string }}
 */
export const calculatePasswordStrength = (password) => {
  if (!password) {
    return { score: 0, label: '', color: 'gray' };
  }

  const { checks } = validatePassword(password);
  
  // Basis-Score aus erfüllten Checks (je 15 Punkte = max 75)
  let score = 0;
  if (checks.minLength) score += 15;
  if (checks.hasUppercase) score += 15;
  if (checks.hasLowercase) score += 15;
  if (checks.hasNumber) score += 15;
  if (checks.hasSpecial) score += 15;

  // Bonus für extra Länge (bis zu 25 zusätzliche Punkte)
  const extraLength = Math.max(0, password.length - PASSWORD_REQUIREMENTS.minLength);
  score += Math.min(25, extraLength * 2.5);

  // Score auf 100 begrenzen
  score = Math.min(100, Math.round(score));

  // Label und Farbe basierend auf Score
  let label, color;
  if (score < 25) {
    label = 'Sehr schwach';
    color = 'red';
  } else if (score < 50) {
    label = 'Schwach';
    color = 'orange';
  } else if (score < 75) {
    label = 'Mittel';
    color = 'yellow';
  } else if (score < 100) {
    label = 'Stark';
    color = 'green';
  } else {
    label = 'Sehr stark';
    color = 'emerald';
  }

  return { score, label, color };
};

/**
 * Gibt die menschenlesbare Liste der Anforderungen zurück
 * @returns {Array<{ key: string, label: string }>}
 */
export const getRequirementsList = () => [
  { key: 'minLength', label: `Mindestens ${PASSWORD_REQUIREMENTS.minLength} Zeichen` },
  { key: 'hasUppercase', label: 'Mindestens ein Großbuchstabe (A-Z)' },
  { key: 'hasLowercase', label: 'Mindestens ein Kleinbuchstabe (a-z)' },
  { key: 'hasNumber', label: 'Mindestens eine Zahl (0-9)' },
  { key: 'hasSpecial', label: 'Mindestens ein Sonderzeichen (!@#$%...)' },
];
