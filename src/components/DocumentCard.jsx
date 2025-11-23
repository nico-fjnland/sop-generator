import React from 'react';
import { PencilSimple, Trash } from '@phosphor-icons/react';
import { Checkbox } from './ui/checkbox';

const DocumentCard = ({ 
  doc, 
  onOpen, 
  onDelete, 
  isSelected = false, 
  onSelectToggle
}) => {
  return (
    <div 
      className={`group relative flex items-center gap-4 px-4 py-4 rounded-lg border transition-all bg-card border-border hover:border-primary/50 hover:shadow-sm ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}
    >
      <div className="flex-shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelectToggle(doc.id)}
        />
      </div>
      
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onOpen(doc.id)}
      >
        <h3 className="font-medium text-foreground truncate text-base">
          {doc.title || 'Unbenanntes Dokument'}
        </h3>
      </div>
      
      <div className="flex-1 flex justify-center items-center">
        <span className="text-xs text-muted-foreground whitespace-nowrap leading-none">
          Bearbeitet am: {new Date(doc.updated_at).toLocaleString('de-DE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} Uhr
        </span>
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onOpen(doc.id); }}
          className="p-2 hover:bg-muted rounded-md transition-colors flex items-center justify-center"
          title="Bearbeiten"
        >
          <PencilSimple size={16} className="text-muted-foreground" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(doc.id, e); }}
          className="p-2 hover:bg-destructive/10 rounded-md transition-colors flex items-center justify-center"
          title="Löschen"
        >
          <Trash size={16} className="text-destructive" />
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;

