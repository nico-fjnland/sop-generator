import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Spinner } from './ui/spinner';
import { FileJs, CheckCircle, Info } from '@phosphor-icons/react';

const BulkExportDialog = ({ 
  open, 
  onOpenChange, 
  selectedCount, 
  onExport,
  isExporting = false,
  progress = null
}) => {
  const handleExport = () => {
    onExport('json');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Dokumente exportieren</AlertDialogTitle>
          <AlertDialogDescription>
            {selectedCount === 1 
              ? 'Du hast 1 Dokument ausgewählt.' 
              : `Du hast ${selectedCount} Dokumente ausgewählt.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!isExporting ? (
          <div className="space-y-4 py-4">
            {/* JSON Export Info */}
            <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-primary bg-primary/5">
              <FileJs size={32} weight="fill" className="text-primary flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">JSON-Export</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Exportiert alle Dokumentdaten vollständig. JSON-Dateien können jederzeit wieder importiert werden.
                </p>
              </div>
            </div>
            
            {/* Info Box */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <p>
                <strong>PDF/Word-Export:</strong> Für originalgetreue PDF- oder Word-Dateien öffne das Dokument im Editor und nutze dort die Export-Funktion.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-4">
              {progress?.completed ? (
                <>
                  <CheckCircle size={48} weight="fill" className="text-green-500" />
                  <div className="text-center">
                    <p className="font-medium">Export abgeschlossen!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {progress.current} von {progress.total} Dokumente exportiert
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Spinner className="h-12 w-12" />
                  <div className="text-center">
                    <p className="font-medium">Exportiere Dokumente...</p>
                    {progress && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {progress.current} von {progress.total}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <AlertDialogFooter>
          {!isExporting ? (
            <>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleExport}>
                Als JSON exportieren
              </AlertDialogAction>
            </>
          ) : progress?.completed ? (
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              Schließen
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkExportDialog;

