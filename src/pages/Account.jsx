import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
import EmptyState from '../components/EmptyState';
import DocumentCard from '../components/DocumentCard';
import BulkExportDialog from '../components/BulkExportDialog';
import { 
  User, 
  FileText, 
  Plus, 
  Upload,
  Layout,
  ArrowLeft,
  Export,
  CheckSquare,
  Square,
  Palette as PaletteIcon,
  TextAa,
  PuzzlePiece,
  Ruler,
  CornersOut
} from '@phosphor-icons/react';
import { getDocuments, deleteDocument, saveDocument } from '../services/documentService';
import { importFromJson, exportMultipleDocuments } from '../utils/exportUtils';
import { toast } from 'sonner';

export default function Account({ editorGradient, toggleEditorGradient }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  
  // Get current tab from URL, with fallback to 'sops'
  const currentTab = (() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['sops', 'templates', 'design-manual', 'profile'].includes(tabParam) ? tabParam : 'sops';
  })();

  // Function to change tabs - updates URL only
  const changeTab = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Data State
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [hospital, setHospital] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Account Security State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

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

  useEffect(() => {
    let ignore = false;
    
    async function fetchData() {
      setLoading(true);
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`first_name, last_name, job_position, hospital, avatar_url`)
          .eq('id', user.id)
          .single();

        if (!ignore) {
          if (profileError && profileError.code !== 'PGRST116') {
            console.warn(profileError);
          } else if (profile) {
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
            setJobPosition(profile.job_position || '');
            setHospital(profile.hospital || '');
            setAvatarUrl(profile.avatar_url || '');
          }
        }

        setLoadingDocs(true);
        const { data: docs, error: docsError } = await getDocuments(user.id);
        if (!ignore && docs) {
          setDocuments(docs);
        }
        setLoadingDocs(false);

      } catch (error) {
        console.error('Error loading data!', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchData();
    return () => {
      ignore = true;
    };
  }, [user]);

  async function updateProfile(event) {
    event.preventDefault();
    setUpdating(true);

    try {
      const updates = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        job_position: jobPosition,
        hospital: hospital,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };

      let { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      toast.success('Profil erfolgreich aktualisiert');
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Profils');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  }

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
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      
      const updates = {
        id: user.id,
        avatar_url: data.publicUrl,
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

      const { data, error } = await saveDocument(
        user.id,
        importedState.headerTitle || 'Importiertes Dokument',
        importedState.headerStand || 'STAND',
        contentToSave
      );

      if (error) {
        toast.error('Fehler beim Speichern des importierten Dokuments');
        return;
      }

      const { data: docs } = await getDocuments(user.id);
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

  const toggleSelectAll = () => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents.map(doc => doc.id)));
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

  // --- Sub-Components ---

  const TabButton = ({ id, icon: Icon, label, count }) => (
    <button
      onClick={() => changeTab(id)}
      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        currentTab === id 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} weight={currentTab === id ? 'fill' : 'regular'} />
        <span>{label}</span>
      </div>
      {count !== undefined ? (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          currentTab === id 
            ? 'bg-primary-foreground/20 text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {count}
        </span>
      ) : (
        <span className="w-0"></span>
      )}
    </button>
  );

  // --- Views ---

  const SopsView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meine Leitfäden</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte deine gespeicherten SOP-Dokumente
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedDocs.size > 0 && (
            <Button 
              onClick={handleBulkExport} 
              variant="outline" 
              size="sm" 
              className="gap-2"
            >
              <Export size={16} />
              Exportieren ({selectedDocs.size})
            </Button>
          )}
          <Button onClick={triggerImport} size="sm" variant="outline" className="gap-2">
            <Upload size={16} />
            Importieren
          </Button>
          <Button onClick={() => navigate('/?new=true')} size="sm" className="gap-2">
            <Plus size={16} weight="bold" />
            Neu
          </Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {documents.length > 0 && (
        <div className="flex items-center gap-2 py-2">
          <Checkbox
            checked={selectedDocs.size === documents.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-muted-foreground cursor-pointer" onClick={toggleSelectAll}>
            {selectedDocs.size === documents.length ? 'Alle abwählen' : 'Alle auswählen'}
          </span>
        </div>
      )}

      {/* Documents List */}
      {loadingDocs ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted/30 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : documents.length === 0 ? (
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
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
          <DocumentCard
              key={doc.id} 
            doc={doc}
            onOpen={handleOpenDocument}
            onDelete={handleDeleteDocument}
            isSelected={selectedDocs.has(doc.id)}
            onSelectToggle={toggleDocSelection}
          />
          ))}
                </div>
      )}
                  </div>
  );

  const TemplatesView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SOP Templates</h1>
        <p className="text-muted-foreground mt-1">
          Vorgefertigte Vorlagen für häufige SOPs
        </p>
                </div>
      
      <EmptyState 
        icon={Layout}
        title="Demnächst verfügbar"
        description="Wir arbeiten an einer Sammlung professioneller SOP-Vorlagen für verschiedene medizinische Bereiche."
      />
              </div>
  );

  const DesignManualView = () => {
    const colors = [
      { name: 'Primary', class: 'bg-primary text-primary-foreground' },
      { name: 'Secondary', class: 'bg-secondary text-secondary-foreground' },
      { name: 'Destructive', class: 'bg-destructive text-destructive-foreground' },
      { name: 'Muted', class: 'bg-muted text-muted-foreground' },
      { name: 'Accent', class: 'bg-accent text-accent-foreground' },
      { name: 'Popover', class: 'bg-popover text-popover-foreground' },
      { name: 'Card', class: 'bg-card text-card-foreground' },
      { name: 'Border', class: 'bg-border text-foreground' },
      { name: 'Input', class: 'bg-input text-foreground' },
      { name: 'Ring', class: 'bg-ring text-white' },
    ];

    const sopColors = [
      { name: 'Full Dark', hex: '#000000', text: 'white' },
      { name: 'Primary Text', hex: '#003366', text: 'white' },
      { name: 'Blue Shade 1', hex: '#004D99', text: 'white' },
      { name: 'Blue Shade 2', hex: '#0066CC', text: 'white' },
      { name: 'Blue Shade 3', hex: '#0080FF', text: 'white' },
      { name: 'Brand Primary', hex: '#3399FF', text: 'black' },
      { name: 'Blue Shade 4', hex: '#66B3FF', text: 'black' },
      { name: 'Blue Shade 5', hex: '#99CCFF', text: 'black' },
      { name: 'Blue Shade 6', hex: '#CCE6FF', text: 'black' },
      { name: 'Blue Shade 7', hex: '#E5F2FF', text: 'black' },
      { name: 'Full White', hex: '#FFFFFF', text: 'black' },
      { name: 'Dark Red', hex: '#8A1A0F', text: 'white' },
      { name: 'Primary Red', hex: '#EB5547', text: 'white' },
      { name: 'Light Red', hex: '#FCEAE8', text: 'black' },
      { name: 'Dark Green', hex: '#23631D', text: 'white' },
      { name: 'Primary Green', hex: '#57CB4D', text: 'black' },
      { name: 'Light Green', hex: '#ECF9EB', text: 'black' },
      { name: 'Dark Yellow', hex: '#B27700', text: 'white' },
      { name: 'Primary Yellow', hex: '#FFBB33', text: 'black' },
      { name: 'Light Yellow', hex: '#FFF7E6', text: 'black' },
      { name: 'Dark Petrol', hex: '#1F7A73', text: 'white' },
      { name: 'Primary Petrol', hex: '#47D1C6', text: 'black' },
      { name: 'Light Petrol', hex: '#EBFAF9', text: 'black' },
      { name: 'Dark Violett', hex: '#4D0891', text: 'white' },
      { name: 'Primary Violett', hex: '#993DF5', text: 'white' },
      { name: 'Light Violett', hex: '#F5ECFE', text: 'black' },
      { name: 'Dark Grey', hex: '#B3B3B3', text: 'black' },
      { name: 'Primary Grey', hex: '#EDEDED', text: 'black' },
      { name: 'Light Grey', hex: '#F4F4F4', text: 'black' },
    ];

    const typography = [
      { label: 'Heading 1', element: <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">The quick brown fox</h1>, description: 'text-4xl font-extrabold tracking-tight lg:text-5xl' },
      { label: 'Heading 2', element: <h2 className="text-2xl font-semibold tracking-tight first:mt-0">The quick brown fox</h2>, description: 'text-2xl font-semibold tracking-tight' },
      { label: 'Heading 3', element: <h3 className="text-xl font-semibold tracking-tight">The quick brown fox</h3>, description: 'text-xl font-semibold tracking-tight' },
      { label: 'Heading 4', element: <h4 className="text-lg font-semibold tracking-tight">The quick brown fox</h4>, description: 'text-lg font-semibold tracking-tight' },
      { label: 'Paragraph', element: <p className="leading-7 [&:not(:first-child)]:mt-6">The quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow.</p>, description: 'leading-7 [&:not(:first-child)]:mt-6' },
      { label: 'Small', element: <small className="text-sm font-medium leading-none">The quick brown fox jumps over the lazy dog.</small>, description: 'text-sm font-medium leading-none' },
      { label: 'Muted', element: <p className="text-sm text-muted-foreground">The quick brown fox jumps over the lazy dog.</p>, description: 'text-sm text-muted-foreground' },
    ];

    return (
      <div className="space-y-16">
        {/* Hero Section - Geist Style */}
        <div className="space-y-2 pb-8 border-b">
          <h1 className="text-2xl font-semibold tracking-tight">Design System</h1>
          <p className="text-sm text-muted-foreground">
            Designrichtlinien, Komponenten und Ressourcen für konsistente Benutzererfahrungen.
          </p>
              </div>

        {/* Color Section - Geist Style */}
        <section className="space-y-12">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Farben</h2>
            <p className="text-sm text-muted-foreground">
              Ein kontrastreiches, zugängliches Farbsystem.
            </p>
          </div>
          
          {/* Theme Colors */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-muted-foreground">Theme Colors</h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <div key={color.name} className="group">
                  <div 
                    className={`w-16 h-16 rounded border hover:border-foreground/20 transition-all cursor-pointer ${color.class}`}
                    onClick={() => {
                      navigator.clipboard.writeText(color.name);
                      toast.success('Kopiert!');
                    }}
                    title={color.name}
                  />
            </div>
          ))}
        </div>
    </div>

          {/* SOP Color System */}
    <div className="space-y-6">
            <h3 className="text-sm font-medium text-muted-foreground">SOP Farbsystem</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-2">
              {sopColors.map((color) => (
                <div key={color.hex} className="group">
                  <div 
                    className="w-full aspect-square rounded border hover:border-foreground/20 transition-all cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => {
                      navigator.clipboard.writeText(color.hex);
                      toast.success('Kopiert!');
                    }}
                    title={`${color.name} - ${color.hex}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Background Gradients */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-muted-foreground">Hintergrund-Verläufe</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="h-24 rounded border light-gradient-bg" />
                <p className="text-xs font-mono text-muted-foreground">Light</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded border dark-gradient-bg dark" />
                <p className="text-xs font-mono text-muted-foreground">Dark</p>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Section - Geist Style */}
        <section className="space-y-12">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Typografie</h2>
            <p className="text-sm text-muted-foreground">
              Klare typografische Hierarchie für Lesbarkeit und Ordnung.
            </p>
          </div>
          
          <div className="space-y-8">
            {typography.map((type, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-4 pb-2 border-b">
                  <span className="text-xs font-mono text-muted-foreground min-w-[80px]">{type.label}</span>
                  <code className="text-xs font-mono text-muted-foreground/60">{type.description}</code>
                </div>
                <div className="pl-2">
                  {type.element}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Components Section - Geist Style */}
        <section className="space-y-12">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Komponenten</h2>
            <p className="text-sm text-muted-foreground">
              Bausteine für React-Anwendungen.
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Buttons</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-xs font-mono text-muted-foreground/60">Variants</p>
                  <div className="flex flex-wrap gap-2">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-mono text-muted-foreground/60">Sizes</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm">Small</Button>
                    <Button>Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-mono text-muted-foreground/60">States</p>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled>Disabled</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing Section - Geist Style */}
        <section className="space-y-12">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Abstände</h2>
            <p className="text-sm text-muted-foreground">
              8px-basiertes System für konsistente Layouts.
            </p>
          </div>
          
          <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
            {[4, 8, 12, 16, 20, 24, 32, 40, 48, 64].map((space) => (
              <div key={space} className="space-y-2">
                <div className="flex items-end justify-center h-20 border rounded p-2">
                  <div 
                    className="bg-foreground w-full"
                    style={{ height: `${space/4}rem` }}
                  />
                </div>
                <p className="text-xs font-mono text-center text-muted-foreground">{space}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Border Radius Section - Geist Style */}
        <section className="space-y-12">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Eckenradien</h2>
            <p className="text-sm text-muted-foreground">
              Definierte Rundungen für verschiedene UI-Elemente.
            </p>
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
            <div className="space-y-2">
              <div className="w-full aspect-square bg-foreground rounded-none border" />
              <p className="text-xs font-mono text-center text-muted-foreground">0</p>
            </div>
            <div className="space-y-2">
              <div className="w-full aspect-square bg-foreground rounded border" />
              <p className="text-xs font-mono text-center text-muted-foreground">4</p>
            </div>
            <div className="space-y-2">
              <div className="w-full aspect-square bg-foreground rounded-md border" />
              <p className="text-xs font-mono text-center text-muted-foreground">6</p>
            </div>
            <div className="space-y-2">
              <div className="w-full aspect-square bg-foreground rounded-lg border" />
              <p className="text-xs font-mono text-center text-muted-foreground">8</p>
            </div>
            <div className="space-y-2">
              <div className="w-full aspect-square bg-foreground rounded-xl border" />
              <p className="text-xs font-mono text-center text-muted-foreground">12</p>
            </div>
            <div className="space-y-2">
              <div className="w-full aspect-square bg-foreground rounded-2xl border" />
              <p className="text-xs font-mono text-center text-muted-foreground">16</p>
            </div>
            <div className="space-y-2">
              <div className="w-full aspect-square bg-foreground rounded-full border" />
              <p className="text-xs font-mono text-center text-muted-foreground">full</p>
            </div>
          </div>
        </section>

        {/* Footer - Geist Style */}
        <div className="pt-16 pb-8">
          <p className="text-xs text-muted-foreground/60 text-center">
            Design-Elemente für konsistente Benutzererfahrungen
          </p>
      </div>
    </div>
  );
  };

  const ProfileView = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil & Einstellungen</h1>
        <p className="text-muted-foreground mt-1">
          Verwalte deine persönlichen Informationen und Kontoeinstellungen
        </p>
      </div>

      {/* Profile Information */}
      <form onSubmit={updateProfile} className="space-y-8">
        {/* Avatar Section */}
        <div className="flex items-start gap-6">
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
          <div className="flex-1 pt-2">
            <p className="font-semibold text-lg">
              {firstName || lastName ? `${firstName} ${lastName}` : 'Benutzer'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {uploading ? 'Wird hochgeladen...' : 'Klicke auf das Symbol um dein Profilbild zu ändern'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Personal Information */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Persönliche Informationen</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
                <Label htmlFor="firstName">Vorname</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Max"
            />
          </div>
          <div className="space-y-2">
                <Label htmlFor="lastName">Nachname</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Mustermann"
            />
          </div>
          <div className="space-y-2">
                <Label htmlFor="jobPosition">Position</Label>
            <Input
              id="jobPosition"
              type="text"
              value={jobPosition}
              onChange={(e) => setJobPosition(e.target.value)}
              placeholder="Assistenzarzt"
            />
          </div>
          <div className="space-y-2">
                <Label htmlFor="hospital">Krankenhaus</Label>
            <Input
              id="hospital"
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="Klinikum Berlin"
            />
              </div>
          </div>
        </div>

          <div className="flex justify-end">
          <Button type="submit" disabled={updating}>
            {updating ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </Button>
          </div>
        </div>
      </form>

      <Separator />

      {/* Appearance Settings */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Darstellung</h2>
          <p className="text-sm text-muted-foreground">
            Passe das Erscheinungsbild der Anwendung an
          </p>
        </div>

        {/* Editor Gradient Setting */}
        <div className="space-y-4 p-6 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <PaletteIcon size={18} className="text-muted-foreground" />
                <Label className="text-base font-medium">Editor-Hintergrund</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Wähle zwischen hellem und dunklem Verlauf für den Editor
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              onClick={() => editorGradient === 'dark' && toggleEditorGradient()}
              className={`p-4 rounded-lg border-2 transition-all ${
                editorGradient === 'light'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="h-16 w-full rounded light-gradient-bg mb-3"></div>
              <div className="text-sm font-medium">Heller Verlauf</div>
              <div className="text-xs text-muted-foreground mt-1">Standard</div>
            </button>

            <button
              type="button"
              onClick={() => editorGradient === 'light' && toggleEditorGradient()}
              className={`p-4 rounded-lg border-2 transition-all ${
                editorGradient === 'dark'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="h-16 w-full rounded dark-gradient-bg dark mb-3"></div>
              <div className="text-sm font-medium">Dunkler Verlauf</div>
              <div className="text-xs text-muted-foreground mt-1">Alternative</div>
            </button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Security Settings */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Sicherheitseinstellungen</h2>
          <p className="text-sm text-muted-foreground">
            Aktualisiere deine E-Mail-Adresse oder dein Passwort
          </p>
        </div>

        {/* Change Email */}
        <form onSubmit={updateEmail} className="space-y-4 p-6 border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label>E-Mail-Adresse ändern</Label>
            <p className="text-xs text-muted-foreground">Aktuelle E-Mail: {user.email}</p>
          </div>
          <div className="space-y-2">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="neue-email@example.com"
            />
          </div>
          <Button type="submit" size="sm" disabled={updatingEmail}>
            {updatingEmail ? 'Wird aktualisiert...' : 'E-Mail ändern'}
          </Button>
        </form>

        {/* Change Password */}
        <form onSubmit={updatePassword} className="space-y-4 p-6 border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label>Passwort ändern</Label>
            <p className="text-xs text-muted-foreground">Mindestens 6 Zeichen</p>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Neues Passwort"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort bestätigen"
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={updatingPassword}>
            {updatingPassword ? 'Wird aktualisiert...' : 'Passwort ändern'}
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${editorGradient === 'light' ? 'light-gradient-bg' : 'dark-gradient-bg dark'} transition-colors duration-200`}>
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
      
      <div className="flex min-h-screen">
        {/* Sidebar Navigation - Fixed, full height, left aligned */}
        <aside className="fixed left-0 top-0 w-64 no-print bg-background border-r border-border">
          <div className="h-screen flex flex-col py-8 px-6">
            {/* Spacer to push content to bottom */}
            <div className="flex-1"></div>

            {/* Navigation - Bottom section */}
            <nav className="space-y-1">
              <TabButton 
                id="sops" 
                icon={FileText} 
                label="Meine Leitfäden" 
                count={documents.length} 
              />
              <TabButton 
                id="templates" 
                icon={Layout} 
                label="SOP Templates" 
              />
              <TabButton 
                id="design-manual" 
                icon={PaletteIcon} 
                label="Design Manual" 
              />
              <TabButton 
                id="profile" 
                icon={User} 
                label="Profil & Einstellungen" 
              />
            </nav>

            {/* Back to Editor - Very bottom */}
            <div className="pt-6">
              <Separator className="mb-4" />
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={16} />
                Zurück zum Editor
              </Button>
            </div>
            </div>
          </aside>

        {/* Main Content - Aligned near sidebar */}
        <main className="flex-1 overflow-y-auto p-6 ml-64">
          <div className="w-full max-w-5xl pt-6 pb-8 px-8">
            {currentTab === 'sops' && <SopsView />}
            {currentTab === 'templates' && <TemplatesView />}
            {currentTab === 'design-manual' && <DesignManualView />}
            {currentTab === 'profile' && <ProfileView />}
          </div>
          </main>
      </div>
    </div>
  );
}
