import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Spinner } from '../components/ui/spinner';
import EmptyState from '../components/EmptyState';
import DocumentCard, { MEDICAL_CATEGORIES } from '../components/DocumentCard';
import BulkExportDialog from '../components/BulkExportDialog';
import { 
  User, 
  FileText, 
  Plus, 
  Upload,
  Layout,
  ArrowLeft,
  Export,
  CloudArrowUp,
  Globe,
  SignOut,
  ChatCircleDots,
  Trash,
  Warning,
  Buildings,
  MapPin,
  UsersThree,
  Link as LinkIcon,
  LockKey as LockKeyIcon,
  CaretUp,
  CaretDown,
  Funnel,
  X,
  Eye,
  EyeSlash,
  Check,
  Circle,
  CheckCircle,
  XCircle,
  WarningCircle
} from '@phosphor-icons/react';
import { getDocuments, deleteDocument, saveDocument, updateDocumentCategory } from '../services/documentService';
import { updateOrganization } from '../services/organizationService';
import { exportMultipleDocuments } from '../utils/exportUtils';
import { toast } from 'sonner';
import AccountDropdown from '../components/AccountDropdown';
import { HospitalCombobox } from '../components/ui/hospital-combobox';
import { PositionCombobox } from '../components/ui/position-combobox';
import { useKlinikAtlas } from '../hooks/useKlinikAtlas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

// SortButton Component
const SortButton = ({ column, sortConfig, onSort, children }) => {
  const isActive = sortConfig.column === column;
  const isAsc = isActive && sortConfig.direction === 'asc';
  
  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1.5 hover:text-gray-700 transition-colors group"
    >
      <span>{children}</span>
      {isActive ? (
        isAsc ? (
          <CaretUp size={16} weight="fill" className="text-primary" />
        ) : (
          <CaretDown size={16} weight="fill" className="text-primary" />
        )
      ) : (
        <CaretDown size={16} weight="fill" className="text-gray-300 group-hover:text-gray-400" />
      )}
    </button>
  );
};

// CategoryFilter Component
const CategoryFilter = ({ categoryFilter, setCategoryFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = React.useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (filterRef.current) {
      const rect = filterRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={filterRef}>
      <button
        onClick={handleOpen}
        className={`flex items-center gap-1.5 hover:text-gray-700 transition-colors ${categoryFilter ? 'text-primary' : ''}`}
      >
        <span>Fachgebiet</span>
        <Funnel size={16} weight={categoryFilter ? 'fill' : 'regular'} />
      </button>
      
      {isOpen && (
        <div 
          className="fixed w-52 bg-popover text-popover-foreground rounded-md shadow-md border p-1 z-[9999]"
          style={{ top: position.top, left: position.left, textTransform: 'none', letterSpacing: 'normal', fontWeight: 'normal' }}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fachgebiet
          </div>
          <div className="-mx-1 my-1 h-px bg-muted" />
          <div
            onClick={() => { setCategoryFilter(null); setIsOpen(false); }}
            className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex-1">Alle Fachgebiete</span>
            {!categoryFilter && <Check className="h-3.5 w-3.5 text-primary" weight="bold" />}
          </div>
          <div
            onClick={() => { setCategoryFilter('none'); setIsOpen(false); }}
            className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex-1">Ohne Fachgebiet</span>
            {categoryFilter === 'none' && <Check className="h-3.5 w-3.5 text-primary" weight="bold" />}
          </div>
          <div className="-mx-1 my-1 h-px bg-muted" />
          {MEDICAL_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => { setCategoryFilter(cat.id); setIsOpen(false); }}
              className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="flex items-center justify-center w-4 h-4 flex-shrink-0" style={{ color: cat.color }}>{cat.iconComponent}</span>
              <span className="flex-1">{cat.label}</span>
              {categoryFilter === cat.id && <Check className="h-3.5 w-3.5 text-primary" weight="bold" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// SopsView Component
const SopsView = React.memo(({ 
  documents, loadingDocs, selectedDocs, toggleSelectAll, handleBulkExport,
  triggerImport, navigate, handleOpenDocument, handleDeleteDocument, toggleDocSelection,
  handleCategoryChange
}) => {
  const [sortConfig, setSortConfig] = useState({ column: 'updated_at', direction: 'desc' });
  const [categoryFilter, setCategoryFilter] = useState(null);

  // Sort handler
  const handleSort = (column) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort documents
  const filteredAndSortedDocs = React.useMemo(() => {
    let result = [...documents];
    
    // Filter by category
    if (categoryFilter) {
      if (categoryFilter === 'none') {
        result = result.filter(doc => !doc.category);
      } else {
        result = result.filter(doc => doc.category === categoryFilter);
      }
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.column) {
        case 'title':
          aVal = (a.title || '').toLowerCase();
          bVal = (b.title || '').toLowerCase();
          break;
        case 'category':
          aVal = a.category || '';
          bVal = b.category || '';
          break;
        case 'updated_at':
        default:
          aVal = new Date(a.updated_at).getTime();
          bVal = new Date(b.updated_at).getTime();
          break;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [documents, sortConfig, categoryFilter]);

  const activeFilterLabel = categoryFilter 
    ? categoryFilter === 'none' 
      ? 'Ohne Fachgebiet' 
      : MEDICAL_CATEGORIES.find(c => c.id === categoryFilter)?.label
    : null;

  return (
    <div className="page-container bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#003366]">Meine Leitfäden</h1>
            <p className="text-muted-foreground">
              Verwalte deine gespeicherten SOP-Dokumente
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {selectedDocs.size > 0 && (
              <Button 
                onClick={handleBulkExport} 
                variant="outline" 
                size="sm" 
                className="gap-2 h-9"
              >
                <Export size={16} />
                Exportieren ({selectedDocs.size})
              </Button>
            )}
            <Button onClick={triggerImport} size="sm" variant="outline" className="gap-2 h-9">
              <Upload size={16} />
              Importieren
            </Button>
            <Button onClick={() => navigate('/?new=true')} size="sm" className="gap-2 h-9">
              <Plus size={16} weight="bold" />
              Neu
            </Button>
          </div>
        </div>

        {/* Active Filter Badge */}
        {activeFilterLabel && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-500">Filter:</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {activeFilterLabel}
              <button 
                onClick={() => setCategoryFilter(null)}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Documents Table */}
      {loadingDocs ? (
        <div className="px-8 pb-8 space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="px-8 pb-8 pt-4">
          <EmptyState 
            icon={FileText}
            title="Noch keine Dokumente vorhanden"
            description="Erstelle dein erstes SOP-Dokument oder importiere ein bestehendes."
            action={
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/?new=true')} variant="default" size="sm">
                  Erstes Dokument erstellen
                </Button>
                <Button onClick={triggerImport} variant="outline" size="sm">
                  Dokument importieren
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="bg-gray-50/50">
          {/* Table Header */}
          <div 
            className="grid grid-cols-[auto_1fr_176px_124px_72px] items-center gap-4 px-8 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
            style={{ borderBottom: '1px solid #e5e5e5' }}
          >
            <div className="flex items-center justify-center w-6">
              <Checkbox
                checked={selectedDocs.size === filteredAndSortedDocs.length && filteredAndSortedDocs.length > 0}
                onCheckedChange={toggleSelectAll}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
            <SortButton column="title" sortConfig={sortConfig} onSort={handleSort}>
              Name
            </SortButton>
            <CategoryFilter categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} />
            <SortButton column="updated_at" sortConfig={sortConfig} onSort={handleSort}>
              Bearbeitet
            </SortButton>
            <div></div>
          </div>

          {/* Document Rows */}
          <div className="divide-y divide-gray-100">
            {filteredAndSortedDocs.length === 0 ? (
              <div className="px-8 py-8 text-center text-gray-500 text-sm">
                Keine Dokumente für diesen Filter gefunden
              </div>
            ) : (
              filteredAndSortedDocs.map((doc) => (
                <DocumentCard
                  key={doc.id} 
                  doc={doc}
                  onOpen={handleOpenDocument}
                  onDelete={handleDeleteDocument}
                  isSelected={selectedDocs.has(doc.id)}
                  onSelectToggle={toggleDocSelection}
                  onCategoryChange={handleCategoryChange}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div 
            className="px-8 py-3 text-xs text-gray-400"
            style={{ borderTop: '1px solid #e5e5e5' }}
          >
            {filteredAndSortedDocs.length} von {documents.length} {documents.length === 1 ? 'Dokument' : 'Dokumenten'}
          </div>
        </div>
      )}
    </div>
  );
});

// OrganizationView Component
const OrganizationView = React.memo(({ 
  companyLogo, uploadingLogo, uploadCompanyLogo, removeCompanyLogo, logoQuality,
  hospitalName, setHospitalName, selectedHospital, setSelectedHospital,
  updating, updateProfile
}) => (
  <div className="page-container space-y-4">
    {/* Organisation / Krankenhaus */}
    <div className="bg-white shadow-lg rounded-lg p-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-1 pb-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight text-[#003366]">Organisation</h1>
        <p className="text-muted-foreground">
          Verwalte deine Krankenhaus- und Organisationsdaten
        </p>
      </div>

      {/* Section Header - Full Width */}
      <div className="flex items-center gap-2">
        <Buildings size={20} className="text-primary" weight="duotone" />
        <h2 className="text-xl font-semibold">Krankenhaus & Logo</h2>
      </div>

      {/* Company Logo Row - 1/3 : 2/3 Layout */}
      <div className="grid grid-cols-[1fr_2fr] gap-8 items-start">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Firmenlogo</Label>
          <p className="text-xs text-muted-foreground">
            Wird in deinen SOPs angezeigt
          </p>
        </div>
        <div className="flex items-center gap-6">
          {/* Logo Preview */}
          <div className="relative flex-shrink-0">
            <div className="rounded-lg overflow-hidden bg-muted border-2 border-border flex items-center justify-center" style={{ width: '200px', height: '120px' }}>
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Firmenlogo"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Buildings size={40} weight="duotone" />
                </div>
              )}
            </div>
            {companyLogo && (
              <button
                type="button"
                onClick={removeCompanyLogo}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/90 transition-colors shadow-md"
                title="Logo entfernen"
              >
                <Trash size={14} weight="bold" />
              </button>
            )}
            <label 
              htmlFor="logo-upload-org" 
              className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-md"
              title="Logo ändern"
            >
              <Upload size={14} weight="bold" />
              <input
                id="logo-upload-org"
                type="file"
                accept="image/*,.svg"
                onChange={uploadCompanyLogo}
                disabled={uploadingLogo}
                className="hidden"
              />
            </label>
          </div>

          {/* Quality Checklist */}
          <LogoQualityChecklist quality={logoQuality} hasLogo={!!companyLogo} />
        </div>
      </div>

      {/* Hospital Name Row - 1/3 : 2/3 Layout */}
      <div className="grid grid-cols-[1fr_2fr] gap-8 items-center">
        <div className="space-y-1">
          <Label htmlFor="hospitalName" className="text-sm font-medium">Name des Krankenhauses</Label>
          <p className="text-xs text-muted-foreground">
            Suche im Bundes-Klinik-Atlas oder manuell eingeben
          </p>
        </div>
        <div>
          <HospitalCombobox
            value={hospitalName}
            onChange={setHospitalName}
            onSelect={(hospital) => {
              setSelectedHospital(hospital);
            }}
            placeholder="Krankenhaus suchen oder eingeben..."
          />
        </div>
      </div>

      {/* Hospital Info Box - Always visible */}
      <div className="grid grid-cols-[1fr_2fr] gap-8 items-start">
        <div className="space-y-1">
          <Label className={`text-sm font-medium ${selectedHospital ? 'text-primary' : 'text-muted-foreground'}`}>
            Klinik-Details
          </Label>
          <p className="text-xs text-muted-foreground">
            {selectedHospital 
              ? 'Informationen aus dem Bundes-Klinik-Atlas'
              : 'Wähle eine Klinik aus der Suche'
            }
          </p>
        </div>
        <div className={`p-4 border-2 rounded-lg ${
          selectedHospital 
            ? 'border-primary/20 bg-primary/5' 
            : 'border-dashed border-muted-foreground/20 bg-muted/30'
        }`}>
          {selectedHospital ? (
            <div className="space-y-3">
              {/* Address */}
              {(selectedHospital.street || selectedHospital.city) && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" weight="duotone" />
                  <div className="text-sm">
                    {selectedHospital.street && <div>{selectedHospital.street}</div>}
                    {selectedHospital.zip && selectedHospital.city && (
                      <div>{selectedHospital.zip} {selectedHospital.city}</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Beds */}
              {selectedHospital.beds > 0 && (
                <div className="flex items-center gap-3">
                  <UsersThree size={16} className="text-primary flex-shrink-0" weight="duotone" />
                  <span className="text-sm">{selectedHospital.beds.toLocaleString('de-DE')} Betten</span>
                </div>
              )}
              
              {/* Phone */}
              {selectedHospital.phone && (
                <div className="flex items-center gap-3">
                  <Buildings size={16} className="text-primary flex-shrink-0" weight="duotone" />
                  <a href={`tel:${selectedHospital.phone}`} className="text-sm text-primary hover:underline">
                    {selectedHospital.phone}
                  </a>
                </div>
              )}
              
              {/* Email */}
              {selectedHospital.email && (
                <div className="flex items-center gap-3">
                  <LinkIcon size={16} className="text-primary flex-shrink-0" weight="duotone" />
                  <a href={`mailto:${selectedHospital.email}`} className="text-sm text-primary hover:underline">
                    {selectedHospital.email}
                  </a>
                </div>
              )}
              
              {/* Link to Klinik-Atlas */}
              {selectedHospital.link && (
                <div className="pt-2 border-t border-primary/10">
                  <a 
                    href={selectedHospital.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <Globe size={14} weight="duotone" />
                    Im Bundes-Klinik-Atlas ansehen
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <Buildings size={32} className="text-muted-foreground/40 mb-2" weight="duotone" />
              <p className="text-sm text-muted-foreground">
                Keine Klinik ausgewählt
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Suche oben nach deiner Einrichtung, um Details anzuzeigen
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button Row - 1/3 : 2/3 Layout */}
      <div className="grid grid-cols-[1fr_2fr] gap-8">
        <div></div>
        <div className="flex justify-end">
          <Button onClick={updateProfile} disabled={updating}>
            {updating ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </Button>
        </div>
      </div>
    </div>
  </div>
));

// TemplatesView Component
const TemplatesView = React.memo(() => (
  <div className="page-container bg-white shadow-lg rounded-lg">
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">SOP Templates</h1>
        <p className="text-muted-foreground">
          Vorgefertigte Vorlagen für häufige SOPs
        </p>
      </div>
      
      <div className="py-16">
        <EmptyState 
          icon={Layout}
          title="Demnächst verfügbar"
          description="Wir arbeiten an einer Sammlung professioneller SOP-Vorlagen für verschiedene medizinische Bereiche."
        />
      </div>
    </div>
  </div>
));

// LogoQualityChecklist Component
const LogoQualityChecklist = ({ quality, hasLogo }) => {
  const MIN_RESOLUTION = 300;
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  // Check conditions
  const checks = {
    resolution: quality.isSvg || (quality.width >= MIN_RESOLUTION && quality.height >= MIN_RESOLUTION),
    format: ['SVG', 'PNG'].includes(quality.format),
    formatAcceptable: ['JPEG', 'WebP', 'GIF'].includes(quality.format),
    fileSize: quality.fileSize === null || quality.fileSize <= MAX_FILE_SIZE,
  };

  const getIcon = (passed, warning = false) => {
    if (!hasLogo) return <Circle size={16} weight="regular" className="text-gray-300" />;
    if (passed) return <CheckCircle size={16} weight="fill" className="text-primary" />;
    if (warning) return <WarningCircle size={16} weight="fill" className="text-amber-500" />;
    return <XCircle size={16} weight="fill" className="text-red-500" />;
  };

  const getTextColor = (passed, warning = false) => {
    if (!hasLogo) return 'text-gray-400';
    if (passed) return 'text-primary';
    if (warning) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {getIcon(checks.resolution)}
        <span className={`text-xs ${getTextColor(checks.resolution)}`}>Auflösung</span>
      </div>
      <div className="flex items-center gap-2">
        {getIcon(checks.format, checks.formatAcceptable)}
        <span className={`text-xs ${getTextColor(checks.format, checks.formatAcceptable)}`}>Format (SVG/PNG)</span>
      </div>
      <div className="flex items-center gap-2">
        {getIcon(checks.fileSize)}
        <span className={`text-xs ${getTextColor(checks.fileSize)}`}>Dateigröße</span>
      </div>
    </div>
  );
};

// ProfileView Component
const ProfileView = React.memo(({ 
  avatarUrl, uploading, uploadAvatar, firstName, setFirstName, lastName, setLastName,
  jobPosition, setJobPosition, user,
  updating, updateProfile, newPassword, setNewPassword,
  confirmPassword, setConfirmPassword, updatingPassword, updatePassword, isDeletingAccount,
  handleDeleteAccount
}) => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
  <div className="page-container space-y-4">
    {/* 1. Persönliche Informationen */}
    <form onSubmit={updateProfile} className="bg-white shadow-lg rounded-lg p-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-1 pb-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight text-[#003366]">Account</h1>
        <p className="text-muted-foreground">
          Verwalte deine persönlichen Informationen und Kontoeinstellungen
        </p>
      </div>

      {/* Section Header - Full Width */}
      <div className="flex items-center gap-2">
        <User size={20} className="text-primary" weight="duotone" />
        <h2 className="text-xl font-semibold">Persönliche Informationen</h2>
      </div>

      {/* Avatar Row - 1/3 : 2/3 Layout */}
      <div className="grid grid-cols-[1fr_2fr] gap-8 items-center">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Profilbild</Label>
          <p className="text-xs text-muted-foreground">
            JPG, PNG oder GIF, max. 2MB
          </p>
        </div>
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-border">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  <User size={40} />
                </div>
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-md"
              title="Bild ändern"
            >
              <Upload size={14} weight="bold" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Name Row - 1/3 : 2/3 Layout */}
      <div className="grid grid-cols-[1fr_2fr] gap-8 items-center">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Name</Label>
          <p className="text-xs text-muted-foreground">
            Dein vollständiger Name
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-xs text-muted-foreground">Vorname</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Max"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-xs text-muted-foreground">Nachname</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Mustermann"
            />
          </div>
        </div>
      </div>

      {/* Position Row - 1/3 : 2/3 Layout */}
      <div className="grid grid-cols-[1fr_2fr] gap-8 items-center">
        <div className="space-y-1">
          <Label htmlFor="jobPosition" className="text-sm font-medium">Position</Label>
          <p className="text-xs text-muted-foreground">
            Deine Rolle im Krankenhaus
          </p>
        </div>
        <div>
          <PositionCombobox
            value={jobPosition}
            onChange={setJobPosition}
            placeholder="Position auswählen oder eingeben..."
          />
        </div>
      </div>

      {/* Email Row - 1/3 : 2/3 Layout */}
      <div className="grid grid-cols-[1fr_2fr] gap-8 items-center">
        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm font-medium">E-Mail-Adresse</Label>
          <p className="text-xs text-muted-foreground">
            Deine Anmelde-E-Mail
          </p>
        </div>
        <div>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-muted cursor-not-allowed"
          />
        </div>
      </div>

      {/* Save Button Row - 1/3 : 2/3 Layout */}
      <div className="grid grid-cols-[1fr_2fr] gap-8">
        <div></div>
        <div className="flex justify-end">
          <Button type="submit" disabled={updating}>
            {updating ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </Button>
        </div>
      </div>
    </form>

    {/* 2. Sicherheit */}
    <div className="bg-white shadow-lg rounded-lg p-8 space-y-6">
      {/* Section Header - Full Width */}
      <div className="flex items-center gap-2">
        <LockKeyIcon size={20} className="text-primary" weight="duotone" />
        <h2 className="text-xl font-semibold">Sicherheit</h2>
      </div>

      {/* Password Row - 1/3 : 2/3 Layout */}
      <div className="grid grid-cols-[1fr_2fr] gap-8 items-center">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Passwort ändern</Label>
          <p className="text-xs text-muted-foreground">
            Aktualisiere dein Passwort regelmäßig für erhöhte Sicherheit
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs text-muted-foreground">Neues Passwort</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Passwort bestätigen</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={updatePassword} 
              disabled={updatingPassword || !newPassword || !confirmPassword}
              variant="secondary"
            >
              {updatingPassword ? 'Wird aktualisiert...' : 'Passwort ändern'}
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* 3. Gefährlicher Bereich */}
    <div className="bg-white shadow-lg rounded-lg p-8 space-y-6">
      {/* Section Header - Full Width */}
      <div className="flex items-center gap-2">
        <Warning size={20} className="text-destructive" weight="duotone" />
        <h2 className="text-xl font-semibold text-destructive">Gefährlicher Bereich</h2>
      </div>

      {/* Delete Account Row - 1/3 : 2/3 Layout */}
      <div className="grid grid-cols-[1fr_2fr] gap-8 items-center">
        <div className="space-y-1">
          <Label className="text-sm font-medium text-destructive">Account löschen</Label>
          <p className="text-xs text-muted-foreground">
            Diese Aktion kann nicht rückgängig gemacht werden
          </p>
        </div>
        <div className="p-4 border-2 border-destructive/20 rounded-lg bg-destructive/5">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Lösche deinen Account und alle damit verbundenen Daten permanent.
            </p>
            <Button 
              onClick={handleDeleteAccount} 
              variant="destructive"
              disabled={isDeletingAccount}
              className="gap-2"
            >
              <Trash size={16} weight="bold" />
              {isDeletingAccount ? 'Wird gelöscht...' : 'Account dauerhaft löschen'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
});

export default function Account() {
  const { user, signOut, organization, organizationId, refreshOrganization } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  
  // Get current tab from URL, with fallback to 'sops'
  const currentTab = (() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['sops', 'templates', 'profile', 'organization'].includes(tabParam) ? tabParam : 'sops';
  })();

  // Function to change tabs - updates URL only
  const changeTab = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Data State
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  // Organization State
  const [hospitalName, setHospitalName] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoQuality, setLogoQuality] = useState({
    width: null,
    height: null,
    format: null,
    fileSize: null,
    isSvg: false
  });

  // Function to analyze logo quality
  const analyzeLogoQuality = async (file, imageUrl) => {
    return new Promise((resolve) => {
      const quality = {
        width: null,
        height: null,
        format: null,
        fileSize: file ? file.size : null,
        isSvg: false
      };

      // Determine format
      if (file) {
        const mimeType = file.type;
        if (mimeType === 'image/svg+xml') {
          quality.format = 'SVG';
          quality.isSvg = true;
          // SVG is vector, so dimensions are not as relevant
          quality.width = Infinity;
          quality.height = Infinity;
          resolve(quality);
          return;
        } else if (mimeType === 'image/png') {
          quality.format = 'PNG';
        } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
          quality.format = 'JPEG';
        } else if (mimeType === 'image/gif') {
          quality.format = 'GIF';
        } else if (mimeType === 'image/webp') {
          quality.format = 'WebP';
        } else {
          quality.format = mimeType.split('/')[1]?.toUpperCase() || 'Unbekannt';
        }
      } else if (imageUrl) {
        // Determine format from URL extension
        const ext = imageUrl.split('?')[0].split('.').pop()?.toLowerCase();
        if (ext === 'svg') {
          quality.format = 'SVG';
          quality.isSvg = true;
          quality.width = Infinity;
          quality.height = Infinity;
          resolve(quality);
          return;
        } else if (ext === 'png') {
          quality.format = 'PNG';
        } else if (ext === 'jpg' || ext === 'jpeg') {
          quality.format = 'JPEG';
        } else if (ext === 'gif') {
          quality.format = 'GIF';
        } else if (ext === 'webp') {
          quality.format = 'WebP';
        } else {
          quality.format = ext?.toUpperCase() || 'Unbekannt';
        }
      }

      // Get dimensions for raster images
      const img = new Image();
      img.onload = () => {
        quality.width = img.naturalWidth;
        quality.height = img.naturalHeight;
        resolve(quality);
      };
      img.onerror = () => {
        resolve(quality);
      };
      
      if (file) {
        img.src = URL.createObjectURL(file);
      } else if (imageUrl) {
        img.src = imageUrl;
      } else {
        resolve(quality);
      }
    });
  };
  
  // Klinik-Atlas Hook for restoring hospital details
  const { loadData: loadKlinikAtlas, findByName: findHospitalByName, isInitialized: klinikAtlasLoaded } = useKlinikAtlas();
  
  // Account Security State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Documents State
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState(new Set());

  // Update localStorage count when documents change
  useEffect(() => {
    if (!loadingDocs) {
      localStorage.setItem('documentsCount', documents.length.toString());
    }
  }, [documents, loadingDocs]);
  
  // Export State
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);

  // Load Klinik-Atlas data on mount
  useEffect(() => {
    loadKlinikAtlas();
  }, [loadKlinikAtlas]);

  // Analyze existing logo when loaded
  useEffect(() => {
    if (companyLogo && logoQuality.width === null) {
      analyzeLogoQuality(null, companyLogo).then(quality => {
        setLogoQuality(quality);
      });
    }
  }, [companyLogo, logoQuality.width]);

  // Store hospital name for lookup after Klinik-Atlas loads
  const [pendingHospitalName, setPendingHospitalName] = useState(null);

  // Restore selectedHospital when Klinik-Atlas data is loaded
  useEffect(() => {
    if (klinikAtlasLoaded && pendingHospitalName) {
      const hospital = findHospitalByName(pendingHospitalName);
      if (hospital) {
        setSelectedHospital(hospital);
      }
      setPendingHospitalName(null);
    }
  }, [klinikAtlasLoaded, pendingHospitalName, findHospitalByName]);

  useEffect(() => {
    let ignore = false;
    
    async function fetchData() {
      try {
        // Fetch profile data (personal info only)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`first_name, last_name, job_position, avatar_url`)
          .eq('id', user.id)
          .single();

        if (!ignore) {
          if (profileError) {
            // Wenn kein Profil existiert, erstelle ein leeres
            if (profileError.code === 'PGRST116') {
              console.log('Creating new profile for user:', user.id);
              const { error: insertError } = await supabase
                .from('profiles')
                .insert([{ id: user.id, updated_at: new Date() }]);
              
              if (insertError) {
                console.error('Error creating profile:', insertError);
              }
            } else {
              console.warn(profileError);
            }
          } else if (profile) {
            console.log('Profile loaded:', profile);
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
            setJobPosition(profile.job_position || '');
            setAvatarUrl(profile.avatar_url ? `${profile.avatar_url}?t=${Date.now()}` : null);
          }
        }

        // Load organization data from context
        if (organization && !ignore) {
          setHospitalName(organization.name || '');
          setCompanyLogo(organization.logo_url ? `${organization.logo_url}?t=${Date.now()}` : null);
          
          // Try to restore selectedHospital from Klinik-Atlas
          if (organization.name) {
            if (klinikAtlasLoaded) {
              const hospital = findHospitalByName(organization.name);
              if (hospital) {
                setSelectedHospital(hospital);
              }
            } else {
              // Store for later lookup when Klinik-Atlas data loads
              setPendingHospitalName(organization.name);
            }
          }
        }

        // Load documents for organization (not user)
        if (organizationId) {
          setLoadingDocs(true);
          const { data: docs } = await getDocuments(organizationId);
          if (!ignore && docs) {
            setDocuments(docs);
          }
          setLoadingDocs(false);
        } else {
          setLoadingDocs(false);
        }

      } catch (error) {
        console.error('Error loading data!', error);
        setLoadingDocs(false);
      }
    }

    fetchData();
    return () => {
      ignore = true;
    };
  }, [user, organization, organizationId, klinikAtlasLoaded, findHospitalByName]);

  async function updateProfile(event) {
    event.preventDefault();
    setUpdating(true);

    try {
      // Update personal profile data
      const profileUpdates = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        job_position: jobPosition,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };

      let { error: profileError } = await supabase.from('profiles').upsert(profileUpdates);
      if (profileError) throw profileError;

      // Update organization data
      if (organizationId) {
        const { error: orgError } = await updateOrganization(organizationId, {
          name: hospitalName,
          logo_url: companyLogo,
        });
        if (orgError) throw orgError;
        await refreshOrganization();
      }

      toast.success('Profil erfolgreich aktualisiert');
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Profils');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  }

  const uploadCompanyLogo = async (event) => {
    try {
      setUploadingLogo(true);

      if (!organizationId) {
        throw new Error('Keine Organisation gefunden.');
      }

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Du musst ein Bild auswählen.');
      }

      const file = event.target.files[0];
      
      // Analyze logo quality before upload
      const quality = await analyzeLogoQuality(file, null);
      setLogoQuality(quality);
      
      const fileExt = file.name.split('.').pop();
      // Fester Dateiname pro Organisation - überschreibt vorherige Uploads
      const filePath = `${organizationId}/logo.${fileExt}`;

      // Alte Logo-Dateien der Organisation löschen (falls vorhanden)
      const { data: existingFiles } = await supabase.storage
        .from('brandmarks')
        .list(organizationId);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles
          .filter(f => f.name.startsWith('logo.'))
          .map(f => `${organizationId}/${f.name}`);
        
        if (filesToDelete.length > 0) {
          await supabase.storage.from('brandmarks').remove(filesToDelete);
        }
      }

      // Neue Datei hochladen in den brandmarks Bucket
      let { error: uploadError } = await supabase.storage
        .from('brandmarks')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('brandmarks').getPublicUrl(filePath);
      
      // Cache-Buster hinzufügen, damit der Browser das neue Bild lädt
      const logoUrlWithCacheBuster = `${data.publicUrl}?t=${Date.now()}`;
      console.log('New company logo URL:', logoUrlWithCacheBuster);
      
      setCompanyLogo(logoUrlWithCacheBuster);
      
      // Update organization with new logo
      await updateOrganization(organizationId, {
        logo_url: data.publicUrl, // In DB ohne Cache-Buster speichern
      });
      await refreshOrganization();
      toast.success('Firmenlogo erfolgreich aktualisiert');

    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeCompanyLogo = async () => {
    if (!window.confirm('Möchtest du das Firmenlogo wirklich entfernen?')) {
      return;
    }

    try {
      if (!organizationId) {
        throw new Error('Keine Organisation gefunden.');
      }

      // Logo-Dateien aus dem brandmarks Bucket löschen
      const { data: existingFiles } = await supabase.storage
        .from('brandmarks')
        .list(organizationId);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles
          .filter(f => f.name.startsWith('logo.'))
          .map(f => `${organizationId}/${f.name}`);
        
        if (filesToDelete.length > 0) {
          await supabase.storage.from('brandmarks').remove(filesToDelete);
        }
      }

      setCompanyLogo(null);
      setLogoQuality({
        width: null,
        height: null,
        format: null,
        fileSize: null,
        isSvg: false
      });
      
      // Update organization
      await updateOrganization(organizationId, {
        logo_url: null,
      });
      await refreshOrganization();
      toast.success('Firmenlogo entfernt');
    } catch (error) {
      toast.error('Fehler beim Entfernen des Logos');
      console.error(error);
    }
  };

  const updateEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || newEmail === user.email) {
      toast.error('Bitte gib eine neue E-Mail-Adresse ein.');
      return;
    }

    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('E-Mail-Adresse aktualisiert! Bitte überprüfe deine neue E-Mail für die Bestätigung.');
      setNewEmail('');
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der E-Mail: ' + error.message);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Bitte gib ein neues Passwort ein.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Passwort erfolgreich aktualisiert!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Passworts: ' + error.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Du musst ein Bild auswählen.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Fester Dateiname pro User - überschreibt vorherige Uploads
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Alte Avatar-Dateien des Users löschen (falls vorhanden)
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles
          .filter(f => f.name.startsWith('avatar.'))
          .map(f => `${user.id}/${f.name}`);
        
        if (filesToDelete.length > 0) {
          await supabase.storage.from('avatars').remove(filesToDelete);
        }
      }

      // Neue Datei hochladen
      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // Cache-Buster hinzufügen, damit der Browser das neue Bild lädt
      const avatarUrlWithCacheBuster = `${data.publicUrl}?t=${Date.now()}`;
      console.log('New avatar URL:', avatarUrlWithCacheBuster);
      
      setAvatarUrl(avatarUrlWithCacheBuster);
      
      const updates = {
        id: user.id,
        avatar_url: data.publicUrl, // In DB ohne Cache-Buster speichern
        updated_at: new Date(),
      };
      await supabase.from('profiles').upsert(updates);
      toast.success('Avatar erfolgreich aktualisiert');

    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id, e) => {
    e?.stopPropagation();
    if (window.confirm('Möchtest du dieses Dokument wirklich löschen?')) {
      const { success } = await deleteDocument(id);
      if (success) {
        setDocuments(documents.filter(doc => doc.id !== id));
        setSelectedDocs(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        toast.success('Dokument gelöscht');
      } else {
        toast.error('Fehler beim Löschen des Dokuments');
      }
    }
  };

  const handleOpenDocument = (id) => {
    navigate(`/?id=${id}`);
  };

  const handleImportJson = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!organizationId) {
      toast.error('Keine Organisation gefunden.');
      return;
    }

    try {
      const text = await file.text();
      const importedState = JSON.parse(text);
      
      if (!importedState || !Array.isArray(importedState.rows)) {
        toast.error('Ungültige JSON-Datei');
        return;
      }

      const contentToSave = {
        rows: importedState.rows || [],
        headerLogo: importedState.headerLogo || null,
        footerVariant: importedState.footerVariant || 'default'
      };

      const { error } = await saveDocument(
        organizationId,
        user.id,
        importedState.headerTitle || 'Importiertes Dokument',
        importedState.headerStand || 'STAND',
        contentToSave
      );

      if (error) {
        toast.error('Fehler beim Speichern des importierten Dokuments');
        return;
      }

      const { data: docs } = await getDocuments(organizationId);
      if (docs) {
        setDocuments(docs);
      }

      toast.success('Dokument erfolgreich importiert!');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Fehler beim Importieren der Datei');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation zur Startseite
      navigate('/');
    } catch (error) {
      console.error('Logout exception:', error);
      // Auch bei Exceptions zur Startseite navigieren
      navigate('/');
    }
  };

  const getDisplayName = () => {
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return 'Benutzer';
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmText('');
    setShowDeleteDialog(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText !== 'LÖSCHEN') {
      toast.error('Bitte gib "LÖSCHEN" ein, um fortzufahren');
      return;
    }

    setIsDeletingAccount(true);
    setShowDeleteDialog(false);

    try {
      // RPC-Funktion aufrufen, die den Account serverseitig löscht
      const { error } = await supabase.rpc('delete_own_account');
      
      if (error) {
        // Falls die RPC-Funktion nicht existiert, Fallback auf manuelle Löschung
        if (error.message.includes('function') || error.code === 'PGRST202') {
          console.warn('RPC function not found, using fallback method');
          
          // Erst alle Dokumente des Users löschen
          const { error: docsError } = await supabase
            .from('documents')
            .delete()
            .eq('user_id', user.id);

          if (docsError) throw docsError;

          // Dann das Profil löschen
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);

          if (profileError) throw profileError;

          // User ausloggen (Auth-User kann nur serverseitig gelöscht werden)
          await signOut();
          toast.success('Deine Daten wurden gelöscht. Bitte kontaktiere den Support, um deinen Account vollständig zu entfernen.');
          window.location.href = '/';
          return;
        }
        throw error;
      }

      toast.success('Account wurde erfolgreich gelöscht');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Fehler beim Löschen des Accounts: ' + error.message);
      setIsDeletingAccount(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents.map(doc => doc.id)));
    }
  };

  const handleCategoryChange = async (docId, category) => {
    try {
      const { error } = await updateDocumentCategory(docId, category);
      if (error) throw error;
      
      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, category } : doc
      ));
      
      toast.success(category ? 'Fachgebiet aktualisiert' : 'Fachgebiet entfernt');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Fehler beim Aktualisieren des Fachgebiets');
    }
  };

  const toggleDocSelection = (id) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkExport = () => {
    if (selectedDocs.size === 0) {
      toast.error('Keine Dokumente ausgewählt');
      return;
    }
    setShowExportDialog(true);
  };

  const handleExport = async (format) => {
    setIsExporting(true);
    setExportProgress({ current: 0, total: selectedDocs.size, completed: false });

    try {
      const docIds = Array.from(selectedDocs);
      
      await exportMultipleDocuments(
        docIds,
        format,
        (current, total, completed) => {
          setExportProgress({ current, total, completed });
        }
      );

      toast.success(`${selectedDocs.size} Dokument(e) erfolgreich exportiert`);
      
      // Wait a moment before closing to show completion
      setTimeout(() => {
        setIsExporting(false);
        setShowExportDialog(false);
        setExportProgress(null);
        setSelectedDocs(new Set());
      }, 1500);
      
    } catch (error) {
      console.error('Bulk export error:', error);
      toast.error('Fehler beim Exportieren der Dokumente');
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // --- Views ---

    return (
    <div className="min-h-screen light-gradient-bg transition-colors duration-200">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJson}
        className="hidden"
        accept=".json"
      />
      
      {/* Bulk Export Dialog */}
      <BulkExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        selectedCount={selectedDocs.size}
        onExport={handleExport}
        isExporting={isExporting}
        progress={exportProgress}
      />

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Warning size={20} weight="fill" />
              Account dauerhaft löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Diese Aktion kann <strong>nicht rückgängig</strong> gemacht werden. 
                Alle deine Dokumente und Daten werden permanent gelöscht.
              </p>
              <div className="space-y-2">
                <Label htmlFor="delete-confirm" className="text-sm font-medium">
                  Gib <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-destructive">LÖSCHEN</span> ein, um fortzufahren:
                </Label>
                <Input
                  id="delete-confirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="LÖSCHEN"
                  className="font-mono"
                  autoComplete="off"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAccount}
              disabled={deleteConfirmText !== 'LÖSCHEN' || isDeletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? 'Wird gelöscht...' : 'Account löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="flex flex-col items-center w-full mb-12">
        {/* Toolbar - Aufgeteilt in zwei Teile (wie im Editor) */}
        <div className="no-print flex items-center gap-3 mt-6 mb-4 w-full max-w-[210mm]">
          {/* Linke Toolbar - Navigation */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-gray-200 flex-1">
            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              <Button
                variant={currentTab === 'sops' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changeTab('sops')}
                className="h-8 text-xs px-3 relative"
              >
                <FileText size={16} className="mr-1.5" weight={currentTab === 'sops' ? 'fill' : 'regular'} />
                Meine Leitfäden
                {documents.length > 0 && (
                  <span className={`ml-2 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full ${
                    currentTab === 'sops'
                      ? 'bg-white text-primary'
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {documents.length}
                  </span>
                )}
              </Button>
              <Button
                variant={currentTab === 'templates' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changeTab('templates')}
                className="h-8 text-xs px-3"
              >
                <Layout size={16} className="mr-1.5" weight={currentTab === 'templates' ? 'fill' : 'regular'} />
                SOP Templates
              </Button>
              <Button
                variant={currentTab === 'profile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changeTab('profile')}
                className="h-8 text-xs px-3"
              >
                <User size={16} className="mr-1.5" weight={currentTab === 'profile' ? 'fill' : 'regular'} />
                Account
              </Button>
              <Button
                variant={currentTab === 'organization' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changeTab('organization')}
                className="h-8 text-xs px-3"
              >
                <Buildings size={16} className="mr-1.5" weight={currentTab === 'organization' ? 'fill' : 'regular'} />
                Organisation
              </Button>
            </div>
          </div>

          {/* Rechte Toolbar - Back to Editor & Account */}
          {user && (
            <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Back to Editor */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="h-8 text-xs px-3 text-[#003366]"
              >
                <ArrowLeft size={16} className="mr-1.5" />
                Zurück zum Editor
              </Button>

              <div className="h-4 w-px bg-gray-200" />
              
              {/* Account Button - Eingeloggt */}
              <AccountDropdown 
                user={user} 
                signOut={signOut}
                displayName={getDisplayName()}
                avatarUrl={avatarUrl}
                documentsCount={documents.length}
                onTabChange={changeTab}
              />
            </div>
          )}
        </div>

        {/* Main Content - Gleiche Breite wie Toolbar */}
        <main className="w-full max-w-[210mm]">
          {currentTab === 'sops' && <SopsView 
            documents={documents}
            loadingDocs={loadingDocs}
            selectedDocs={selectedDocs}
            toggleSelectAll={toggleSelectAll}
            handleBulkExport={handleBulkExport}
            triggerImport={triggerImport}
            navigate={navigate}
            handleOpenDocument={handleOpenDocument}
            handleDeleteDocument={handleDeleteDocument}
            toggleDocSelection={toggleDocSelection}
            handleCategoryChange={handleCategoryChange}
          />}
            {currentTab === 'templates' && <TemplatesView />}
          {currentTab === 'profile' && <ProfileView 
            avatarUrl={avatarUrl}
            uploading={uploading}
            uploadAvatar={uploadAvatar}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            jobPosition={jobPosition}
            setJobPosition={setJobPosition}
            user={user}
            updating={updating}
            updateProfile={updateProfile}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            updatingPassword={updatingPassword}
            updatePassword={updatePassword}
            isDeletingAccount={isDeletingAccount}
            handleDeleteAccount={handleDeleteAccount}
          />}
          {currentTab === 'organization' && <OrganizationView 
            companyLogo={companyLogo}
            uploadingLogo={uploadingLogo}
            uploadCompanyLogo={uploadCompanyLogo}
            removeCompanyLogo={removeCompanyLogo}
            logoQuality={logoQuality}
            hospitalName={hospitalName}
            setHospitalName={setHospitalName}
            selectedHospital={selectedHospital}
            setSelectedHospital={setSelectedHospital}
            updating={updating}
            updateProfile={updateProfile}
          />}
          </main>
      </div>
    </div>
  );
}
