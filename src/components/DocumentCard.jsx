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
  const formattedDate = new Date(doc.updated_at).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + ', ' + new Date(doc.updated_at).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' Uhr';

  return (
    <div 
      className={`group relative grid grid-cols-[auto_1fr_170px_72px] items-center gap-4 px-8 py-3 transition-all hover:bg-gray-50/80 ${
        isSelected ? 'bg-primary/5' : ''
      }`}
      style={{ borderBottom: '1px solid #f0f0f0' }}
    >
      {/* Checkbox */}
      <div 
        className="flex items-center justify-center w-6" 
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelectToggle(doc.id)}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>

      {/* Document Name */}
      <div 
        className="min-w-0 cursor-pointer"
        onClick={() => onOpen(doc.id)}
      >
        <h3 className="font-medium text-[#003366] truncate text-sm hover:text-primary transition-colors">
          {doc.title || 'Unbenanntes Dokument'}
        </h3>
      </div>
      
      {/* Modified Date */}
      <div className="text-sm text-gray-500 whitespace-nowrap">
        {formattedDate}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1">
        <button 
          onClick={(e) => { e.stopPropagation(); onOpen(doc.id); }}
          className="p-2 hover:bg-gray-200/80 rounded-lg transition-colors flex items-center justify-center"
          title="Bearbeiten"
        >
          <PencilSimple size={16} className="text-gray-500" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(doc.id, e); }}
          className="p-2 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center"
          title="Löschen"
        >
          <Trash size={16} className="text-red-500" />
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;

