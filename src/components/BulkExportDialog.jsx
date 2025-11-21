import React, { useState } from 'react';
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
import { Label } from './ui/label';
import { Spinner } from './ui/spinner';
import { FileDoc, FilePdf, CheckCircle } from '@phosphor-icons/react';

const BulkExportDialog = ({ 
  open, 
  onOpenChange, 
  selectedCount, 
  onExport,
  isExporting = false,
  progress = null
}) => {
  const [format, setFormat] = useState('pdf');

  const handleExport = () => {
    onExport(format);
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
            <div className="space-y-3">
              <Label>Format auswählen</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat('word')}
                  className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    format === 'word'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <FileDoc 
                    size={32} 
                    weight={format === 'word' ? 'fill' : 'regular'}
                    className={format === 'word' ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <div className="text-center">
                    <div className="font-medium text-sm">Word</div>
                    <div className="text-xs text-muted-foreground">.docx</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    format === 'pdf'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <FilePdf 
                    size={32} 
                    weight={format === 'pdf' ? 'fill' : 'regular'}
                    className={format === 'pdf' ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <div className="text-center">
                    <div className="font-medium text-sm">PDF</div>
                    <div className="text-xs text-muted-foreground">.pdf</div>
                  </div>
                </button>
              </div>
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
                Exportieren
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

