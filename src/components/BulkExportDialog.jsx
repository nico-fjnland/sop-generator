import React, { useState, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { 
  FileJs, 
  FilePdf, 
  FileDoc, 
  CheckCircle, 
  XCircle,
  Warning,
  Info,
  Clock
} from '@phosphor-icons/react';

/**
 * Format option card component
 */
const FormatOption = ({ 
  icon: Icon, 
  title, 
  description, 
  estimate, 
  selected, 
  onClick,
  disabled = false,
  warning = null
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all
      ${selected 
        ? 'border-primary bg-primary/5' 
        : 'border-border hover:border-primary/50 hover:bg-muted/30'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <Icon size={28} weight="fill" className={selected ? 'text-primary' : 'text-muted-foreground'} />
    <div className="flex-1 min-w-0">
      <div className="font-medium text-sm flex items-center gap-2">
        {title}
        {warning && (
          <Warning size={14} className="text-amber-500" />
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      {estimate && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock size={12} />
          {estimate}
        </p>
      )}
      {warning && (
        <p className="text-xs text-amber-600 mt-1">{warning}</p>
      )}
    </div>
  </button>
);

/**
 * Progress item component
 */
const ProgressItem = ({ doc, status }) => (
  <div className="flex items-center gap-2 text-sm py-1">
    {status === 'completed' && <CheckCircle size={16} weight="fill" className="text-green-500 flex-shrink-0" />}
    {status === 'error' && <XCircle size={16} weight="fill" className="text-red-500 flex-shrink-0" />}
    {status === 'loading' && <Spinner className="h-4 w-4 flex-shrink-0" />}
    {status === 'exporting' && <Spinner className="h-4 w-4 flex-shrink-0" />}
    {status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />}
    <span className="truncate">{doc.title}</span>
  </div>
);

const BulkExportDialog = ({ 
  open, 
  onOpenChange, 
  selectedCount,
  selectedDocuments = [], // Array of {id, title, version, html_cached_at, updated_at}
  onExport,
  isExporting = false,
  progress = null, // { current, total, completed, currentDoc, results, errors }
}) => {
  const [selectedFormat, setSelectedFormat] = useState('json');

  // Check which documents have valid HTML cache
  const { cachedDocs, uncachedDocs } = useMemo(() => {
    const cached = [];
    const uncached = [];
    
    // Allow 5 second buffer for timing differences between cache and document save
    const CACHE_BUFFER_MS = 5000;
    
    for (const doc of selectedDocuments) {
      const cacheTime = doc.html_cached_at ? new Date(doc.html_cached_at).getTime() : 0;
      const updateTime = new Date(doc.updated_at).getTime();
      
      // Cache is valid if it exists and was created within 5 seconds of the document update
      const hasValidCache = doc.html_cached_at && (cacheTime >= updateTime - CACHE_BUFFER_MS);
      
      if (hasValidCache) {
        cached.push(doc);
      } else {
        uncached.push(doc);
      }
    }
    
    return { cachedDocs: cached, uncachedDocs: uncached };
  }, [selectedDocuments]);

  // Estimate export time
  const getTimeEstimate = (format, count) => {
    if (format === 'json') return 'Sofort';
    if (count === 0) return 'Keine Dokumente verfügbar';
    const secondsPerDoc = format === 'pdf' ? 4 : 12;
    const parallelFactor = Math.min(count, 10);
    const totalSeconds = Math.ceil(count / parallelFactor) * secondsPerDoc;
    
    if (totalSeconds < 60) return `~${totalSeconds} Sekunden`;
    const minutes = Math.ceil(totalSeconds / 60);
    return `~${minutes} Minute${minutes > 1 ? 'n' : ''}`;
  };

  const handleExport = () => {
    if (selectedFormat === 'json') {
      onExport('json', selectedDocuments);
    } else {
      // For PDF/Word, only export documents with valid cache
      onExport(selectedFormat, cachedDocs);
    }
  };

  const canExportPdfWord = cachedDocs.length > 0;
  const hasUncachedDocs = uncachedDocs.length > 0;

  // Render format selection view
  const renderFormatSelection = () => (
    <div className="space-y-3 py-4">
      <FormatOption
        icon={FilePdf}
        title="PDF"
        description="Originalgetreue PDF-Dateien für Druck und Archivierung"
        estimate={getTimeEstimate('pdf', cachedDocs.length)}
        selected={selectedFormat === 'pdf'}
        onClick={() => setSelectedFormat('pdf')}
        disabled={!canExportPdfWord}
        warning={hasUncachedDocs && selectedFormat === 'pdf' ? `${uncachedDocs.length} Dokument${uncachedDocs.length > 1 ? 'e' : ''} ohne Cache` : null}
      />
      
      <FormatOption
        icon={FileDoc}
        title="Word"
        description="Bearbeitbare Word-Dateien (.docx)"
        estimate={getTimeEstimate('docx', cachedDocs.length)}
        selected={selectedFormat === 'docx'}
        onClick={() => setSelectedFormat('docx')}
        disabled={!canExportPdfWord}
        warning={hasUncachedDocs && selectedFormat === 'docx' ? `${uncachedDocs.length} Dokument${uncachedDocs.length > 1 ? 'e' : ''} ohne Cache` : null}
      />
      
      <FormatOption
        icon={FileJs}
        title="JSON"
        description="Rohdaten für Backup und Import"
        estimate="Sofort"
        selected={selectedFormat === 'json'}
        onClick={() => setSelectedFormat('json')}
      />

      {/* Warning when ALL documents are uncached (PDF/Word completely unavailable) */}
      {!canExportPdfWord && selectedDocuments.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
          <Warning size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              PDF/Word-Export nicht verfügbar
            </p>
            <p className="text-amber-700 mt-1">
              Die ausgewählten Dokumente müssen einmal im Editor geöffnet und gespeichert werden, um den Export-Cache zu erstellen.
            </p>
          </div>
        </div>
      )}

      {/* Warning for partially uncached documents */}
      {canExportPdfWord && hasUncachedDocs && (selectedFormat === 'pdf' || selectedFormat === 'docx') && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
          <Warning size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              {uncachedDocs.length} von {selectedCount} Dokument{selectedCount > 1 ? 'en' : ''} können nicht exportiert werden
            </p>
            <p className="text-amber-700 mt-1">
              Diese Dokumente müssen einmal im Editor geöffnet und gespeichert werden, um den Export-Cache zu erstellen.
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-amber-600 hover:text-amber-800">
                Betroffene Dokumente anzeigen
              </summary>
              <ul className="mt-1 ml-4 list-disc text-amber-700">
                {uncachedDocs.slice(0, 5).map(doc => (
                  <li key={doc.id}>{doc.title}</li>
                ))}
                {uncachedDocs.length > 5 && (
                  <li>...und {uncachedDocs.length - 5} weitere</li>
                )}
              </ul>
            </details>
          </div>
        </div>
      )}

      {/* Info for JSON */}
      {selectedFormat === 'json' && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <p>
            JSON-Dateien enthalten alle Dokumentdaten und können jederzeit wieder importiert werden.
          </p>
        </div>
      )}
    </div>
  );

  // Render progress view
  const renderProgress = () => {
    const isCompleted = progress?.completed;
    const successCount = progress?.results?.length || 0;
    const errorCount = progress?.errors?.length || 0;

    return (
      <div className="py-4 space-y-4">
        {/* Status Header */}
        <div className="flex flex-col items-center gap-3">
          {isCompleted ? (
            errorCount === 0 ? (
              <CheckCircle size={48} weight="fill" className="text-green-500" />
            ) : successCount > 0 ? (
              <Warning size={48} weight="fill" className="text-amber-500" />
            ) : (
              <XCircle size={48} weight="fill" className="text-red-500" />
            )
          ) : (
            <Spinner className="h-12 w-12" />
          )}
          
          <div className="text-center">
            {isCompleted ? (
              <>
                <p className="font-medium">
                  {errorCount === 0 
                    ? 'Export abgeschlossen!' 
                    : successCount > 0 
                      ? 'Export teilweise abgeschlossen'
                      : 'Export fehlgeschlagen'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {successCount} von {progress.total} erfolgreich exportiert
                  {errorCount > 0 && `, ${errorCount} fehlgeschlagen`}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">
                  Exportiere als {selectedFormat === 'pdf' ? 'PDF' : selectedFormat === 'docx' ? 'Word' : 'JSON'}...
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {progress?.current || 0} von {progress?.total || selectedCount}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {!isCompleted && progress && (
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-2 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        )}

        {/* Document List */}
        {(selectedFormat === 'pdf' || selectedFormat === 'docx') && progress && (
          <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
            {progress.results?.map(({ doc }) => (
              <ProgressItem key={doc.id} doc={doc} status="completed" />
            ))}
            {progress.errors?.map(({ doc }) => (
              <ProgressItem key={doc.id} doc={doc} status="error" />
            ))}
            {progress.currentDoc && !progress.completed && (
              <ProgressItem doc={progress.currentDoc} status="exporting" />
            )}
          </div>
        )}

        {/* Error Details */}
        {isCompleted && errorCount > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-red-600 hover:text-red-800">
              Fehlerdetails anzeigen
            </summary>
            <ul className="mt-2 ml-4 space-y-1 text-red-700">
              {progress.errors.map(({ doc, error }) => (
                <li key={doc.id}>
                  <strong>{doc.title}:</strong> {error.userMessage || error.message}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Dokumente exportieren</AlertDialogTitle>
          <AlertDialogDescription>
            {isExporting 
              ? `Exportiere ${selectedFormat === 'json' ? selectedCount : cachedDocs.length} Dokument${(selectedFormat === 'json' ? selectedCount : cachedDocs.length) !== 1 ? 'e' : ''}...`
              : `${selectedCount} Dokument${selectedCount !== 1 ? 'e' : ''} ausgewählt`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isExporting ? renderProgress() : renderFormatSelection()}

        <AlertDialogFooter>
          {!isExporting ? (
            <>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <Button 
                onClick={handleExport}
                disabled={(selectedFormat !== 'json' && !canExportPdfWord)}
              >
                {selectedFormat === 'json' 
                  ? 'Als JSON exportieren'
                  : selectedFormat === 'pdf'
                    ? `${cachedDocs.length} PDF${cachedDocs.length !== 1 ? 's' : ''} exportieren`
                    : `${cachedDocs.length} Word-Datei${cachedDocs.length !== 1 ? 'en' : ''} exportieren`}
              </Button>
            </>
          ) : progress?.completed ? (
            <Button onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          ) : (
            <Button disabled variant="outline">Exportiere...</Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkExportDialog;
