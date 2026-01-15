import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { Spinner } from './ui/spinner';
import { Button } from './ui/button';
import { 
  Warning,
  ClockCounterClockwise,
  CaretLeft,
  CaretRight
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
 * Zeigt die letzten 20 Login-Events des aktuellen Benutzers
 * Mit Pagination (5 Einträge pro Seite)
 */
export default function LoginHistory() {
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 5;

  useEffect(() => {
    async function fetchLoginHistory() {
      try {
        const { data, error: rpcError } = await supabase.rpc('get_login_history', {
          limit_count: 20
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

  // Pagination berechnen
  const totalPages = Math.ceil(loginHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = loginHistory.slice(startIndex, endIndex);

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Feste Höhe für 5 Einträge
  const tableBodyHeight = 312;

  return (
    <div className="space-y-3">
      <div className="border rounded-lg overflow-hidden">
        {/* Header-Tabelle */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground" style={{ width: '40%' }}>Zeitpunkt</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground" style={{ width: '35%' }}>Browser / Gerät</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground" style={{ width: '25%' }}>IP-Adresse</th>
            </tr>
          </thead>
        </table>
        {/* Body-Bereich mit fester Höhe */}
        <div style={{ minHeight: `${tableBodyHeight}px` }}>
          <table className="w-full text-sm">
          <tbody className="divide-y">
            {currentItems.map((entry, index) => {
              const parsedAgent = parseUserAgent(entry.user_agent);
              // Die aktuelle Sitzung ist nur auf Seite 1 der erste Eintrag
              const isCurrentSession = currentPage === 1 && index === 0;
              
              return (
                <tr 
                  key={startIndex + index} 
                  className={`${isCurrentSession ? 'bg-primary/5' : 'hover:bg-muted/30'} transition-colors`}
                >
                  <td className="px-4 py-3" style={{ width: '40%' }}>
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
                  <td className="px-4 py-3" style={{ width: '35%' }}>
                    <span>{parsedAgent.displayName}</span>
                  </td>
                  <td className="px-4 py-3" style={{ width: '25%' }}>
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
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {startIndex + 1}–{Math.min(endIndex, loginHistory.length)} von {loginHistory.length} Einträgen
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <CaretLeft size={16} />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Seite {currentPage} von {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <CaretRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
