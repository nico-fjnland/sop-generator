import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { Spinner } from './ui/spinner';
import { 
  Warning,
  ClockCounterClockwise
} from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Parst den User-Agent String und gibt einen lesbaren Browser/Geräte-Namen zurück
 */
function parseUserAgent(userAgent) {
  if (!userAgent) return { browser: 'Unbekannt', device: 'desktop' };
  
  const ua = userAgent.toLowerCase();
  
  // Browser erkennen
  let browser = 'Unbekannt';
  if (ua.includes('edg/') || ua.includes('edge')) {
    browser = 'Edge';
  } else if (ua.includes('chrome') && !ua.includes('chromium')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('opera') || ua.includes('opr/')) {
    browser = 'Opera';
  } else if (ua.includes('msie') || ua.includes('trident')) {
    browser = 'IE';
  }
  
  // Gerät erkennen
  let device = 'desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'tablet';
  }
  
  // Betriebssystem hinzufügen
  let os = '';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os') || ua.includes('macos')) {
    os = 'macOS';
  } else if (ua.includes('linux') && !ua.includes('android')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }
  
  return { 
    browser, 
    device,
    os,
    displayName: os ? `${browser} auf ${os}` : browser
  };
}

/**
 * Formatiert die IP-Adresse für die Anzeige
 */
function formatIpAddress(ip) {
  if (!ip) return '–';
  // IPv6 localhost zu lesbar machen
  if (ip === '::1') return 'localhost';
  return ip;
}

/**
 * LoginHistory Komponente
 * Zeigt die letzten 10 Login-Events des aktuellen Benutzers
 */
export default function LoginHistory() {
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLoginHistory() {
      try {
        const { data, error: rpcError } = await supabase.rpc('get_login_history', {
          limit_count: 10
        });

        if (rpcError) {
          throw rpcError;
        }

        setLoginHistory(data || []);
      } catch (err) {
        logger.error('Error fetching login history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLoginHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 border-2 border-dashed border-amber-200 rounded-lg bg-amber-50/50">
        <Warning size={20} className="text-amber-500 flex-shrink-0" weight="fill" />
        <div className="text-sm text-amber-700">
          <p className="font-medium">Login-Historie nicht verfügbar</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Die Funktion muss zuerst in Supabase aktiviert werden.
          </p>
        </div>
      </div>
    );
  }

  if (loginHistory.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/30">
        <ClockCounterClockwise size={20} className="text-muted-foreground/40 flex-shrink-0" weight="duotone" />
        <div className="text-sm text-muted-foreground">
          Keine Login-Einträge gefunden.
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Zeitpunkt</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Browser / Gerät</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">IP-Adresse</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {loginHistory.map((entry, index) => {
            const parsedAgent = parseUserAgent(entry.user_agent);
            const isCurrentSession = index === 0;
            
            return (
              <tr 
                key={index} 
                className={`${isCurrentSession ? 'bg-primary/5' : 'hover:bg-muted/30'} transition-colors`}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {new Date(entry.logged_in_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                      {' '}
                      <span className="text-muted-foreground font-normal">
                        {new Date(entry.logged_in_at).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isCurrentSession ? (
                        <span className="text-primary font-medium">Aktuelle Sitzung</span>
                      ) : (
                        formatDistanceToNow(new Date(entry.logged_in_at), { 
                          addSuffix: true, 
                          locale: de 
                        })
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span>{parsedAgent.displayName}</span>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {formatIpAddress(entry.ip_address)}
                  </code>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
