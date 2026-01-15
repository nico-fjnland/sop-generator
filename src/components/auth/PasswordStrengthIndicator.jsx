import React from 'react';
import { Check, X } from '@phosphor-icons/react';
import { 
  validatePassword, 
  calculatePasswordStrength, 
  getRequirementsList 
} from '../../utils/passwordPolicy';

/**
 * Passwort-Stärke-Indikator mit Echtzeit-Feedback
 * Zeigt eine Fortschrittsleiste und/oder Checkliste der Anforderungen
 * 
 * @param {string} password - Das zu validierende Passwort
 * @param {boolean} showRequirements - Zeigt die Anforderungs-Checkliste (default: true)
 * @param {boolean} showStrengthBar - Zeigt die Stärke-Fortschrittsleiste (default: true)
 */
export const PasswordStrengthIndicator = ({ password, showRequirements = true, showStrengthBar = true }) => {
  const { checks } = validatePassword(password);
  const { score, label, color } = calculatePasswordStrength(password);
  const requirements = getRequirementsList();

  // Wenn kein Passwort eingegeben, nichts anzeigen (außer bei statischer Checkliste)
  if (!password && showStrengthBar) {
    return null;
  }

  // Farbe für die Fortschrittsleiste
  const getProgressColor = () => {
    switch (color) {
      case 'red': return 'bg-red-500';
      case 'orange': return 'bg-orange-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      case 'emerald': return 'bg-emerald-500';
      default: return 'bg-gray-300';
    }
  };

  // Text-Farbe für das Label
  const getLabelColor = () => {
    switch (color) {
      case 'red': return 'text-red-600';
      case 'orange': return 'text-orange-600';
      case 'yellow': return 'text-yellow-600';
      case 'green': return 'text-green-600';
      case 'emerald': return 'text-emerald-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`${showStrengthBar && showRequirements ? 'space-y-3 mt-2' : ''}`}>
      {/* Stärke-Anzeige mit Fortschrittsleiste */}
      {showStrengthBar && password && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Passwortstärke</span>
            <span className={`text-xs font-medium ${getLabelColor()}`}>{label}</span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ease-out rounded-full ${getProgressColor()}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      {/* Anforderungs-Checkliste */}
      {showRequirements && (
        <div className="grid grid-cols-1 gap-1">
          {requirements.map((req) => {
            const isValid = password ? checks[req.key] : false;
            return (
              <div 
                key={req.key}
                className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                  isValid ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                {isValid ? (
                  <Check size={14} weight="bold" className="text-green-600 flex-shrink-0" />
                ) : (
                  <X size={14} weight="bold" className="text-gray-400 flex-shrink-0" />
                )}
                <span>{req.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
