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
  LockKey as LockKeyIcon
} from '@phosphor-icons/react';
import { getDocuments, deleteDocument, saveDocument } from '../services/documentService';
import { exportMultipleDocuments } from '../utils/exportUtils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '../components/ui/dropdown-menu';

// SopsView Component
const SopsView = React.memo(({ 
  documents, loadingDocs, selectedDocs, toggleSelectAll, handleBulkExport,
  triggerImport, navigate, handleOpenDocument, handleDeleteDocument, toggleDocSelection
}) => (
  <div className="page-container bg-white shadow-lg rounded-lg">
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Meine Leitfäden</h1>
        <p className="text-muted-foreground">
          Verwalte deine gespeicherten SOP-Dokumente
        </p>
      </div>

    {/* Action Bar */}
    <div className="flex items-center justify-between flex-wrap gap-4 py-4 border-b">
      <div className="flex items-center gap-3">
        {documents.length > 0 && (
          <>
            <Checkbox
              checked={selectedDocs.size === documents.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm font-medium cursor-pointer" onClick={toggleSelectAll}>
              {selectedDocs.size === documents.length ? 'Alle abwählen' : 'Alle auswählen'}
            </span>
            <span className="text-sm text-muted-foreground">
              ({documents.length} {documents.length === 1 ? 'Dokument' : 'Dokumente'})
            </span>
          </>
        )}
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

    {/* Documents List */}
    {loadingDocs ? (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted/30 rounded-lg animate-pulse"></div>
        ))}
      </div>
    ) : documents.length === 0 ? (
      <div className="py-16">
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

// ProfileView Component
const ProfileView = React.memo(({ 
  avatarUrl, uploading, uploadAvatar, firstName, setFirstName, lastName, setLastName,
  jobPosition, setJobPosition, user, companyLogo, uploadingLogo, uploadCompanyLogo,
  removeCompanyLogo, hospitalName, setHospitalName, hospitalEmployees, setHospitalEmployees,
  hospitalWebsite, setHospitalWebsite, hospitalAddress, setHospitalAddress, updating,
  updateProfile, newPassword, setNewPassword,
  confirmPassword, setConfirmPassword, updatingPassword, updatePassword, isDeletingAccount,
  handleDeleteAccount
}) => (
  <div className="page-container bg-white shadow-lg rounded-lg">
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Profil & Einstellungen</h1>
        <p className="text-muted-foreground">
          Verwalte deine persönlichen Informationen und Kontoeinstellungen
        </p>
      </div>

    {/* 1. Persönliche Informationen */}
    <form onSubmit={updateProfile} className="space-y-8 pb-8 border-b">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <User size={20} className="text-primary" weight="duotone" />
          <h2 className="text-xl font-semibold">Persönliche Informationen</h2>
        </div>

        {/* Avatar */}
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
            <p className="text-sm font-medium mb-1">
              {avatarUrl ? 'Profilbild hochgeladen' : 'Kein Profilbild'}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG oder GIF, max. 2MB
            </p>
          </div>
        </div>

        {/* Name Fields */}
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
        </div>

        {/* Job Position & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jobPosition">Position</Label>
            <Input
              id="jobPosition"
              type="text"
              value={jobPosition}
              onChange={(e) => setJobPosition(e.target.value)}
              placeholder="Arzt, Pfleger, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={updating}>
            {updating ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </Button>
        </div>
      </div>
    </form>

    {/* 2. Organisation / Krankenhaus */}
    <div className="space-y-6 pb-8 border-b">
      <div className="flex items-center gap-2">
        <Buildings size={20} className="text-primary" weight="duotone" />
        <h2 className="text-xl font-semibold">Organisation</h2>
      </div>

      {/* Firmenlogo */}
      <div className="space-y-4">
        <Label>Firmenlogo</Label>
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Firmenlogo"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Buildings size={40} weight="duotone" />
                  <span className="text-xs mt-2">Kein Logo</span>
                </div>
              )}
            </div>
            {companyLogo && (
              <button
                type="button"
                onClick={removeCompanyLogo}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full hover:bg-destructive/90 transition-colors shadow-md"
                title="Logo entfernen"
              >
                <Trash size={12} weight="bold" />
              </button>
            )}
          </div>
          <div className="flex-1 pt-2">
            <p className="text-sm font-medium mb-2">
              {companyLogo ? 'Logo hochgeladen' : 'Kein Logo hochgeladen'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Dieses Logo wird automatisch in allen deinen SOPs am oberen rechten Rand des Headers angezeigt.
            </p>
            <label htmlFor="logo-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 cursor-pointer"
                onClick={() => document.getElementById('logo-upload').click()}
                disabled={uploadingLogo}
              >
                <Upload size={16} />
                {uploadingLogo ? 'Wird hochgeladen...' : 'Logo hochladen'}
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={uploadCompanyLogo}
                disabled={uploadingLogo}
                className="hidden"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Empfohlen: Quadratisches Format, PNG mit transparentem Hintergrund
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="hospitalName">Name des Krankenhauses</Label>
          <Input
            id="hospitalName"
            type="text"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            placeholder="Klinikum Berlin"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hospitalEmployees">Anzahl Mitarbeitende</Label>
          <div className="relative">
            <UsersThree size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="hospitalEmployees"
              type="text"
              value={hospitalEmployees}
              onChange={(e) => setHospitalEmployees(e.target.value)}
              placeholder="500"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hospitalWebsite">Webseite (optional)</Label>
          <div className="relative">
            <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="hospitalWebsite"
              type="url"
              value={hospitalWebsite}
              onChange={(e) => setHospitalWebsite(e.target.value)}
              placeholder="https://example.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="hospitalAddress">Adresse</Label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3 top-3 text-muted-foreground" />
            <textarea
              id="hospitalAddress"
              value={hospitalAddress}
              onChange={(e) => setHospitalAddress(e.target.value)}
              placeholder="Musterstraße 123&#10;12345 Berlin&#10;Deutschland"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={updateProfile} disabled={updating}>
          {updating ? 'Wird gespeichert...' : 'Änderungen speichern'}
        </Button>
      </div>
    </div>

    {/* 3. Sicherheit */}
    <div className="space-y-6 pb-8 border-b">
      <div className="flex items-center gap-2">
        <LockKeyIcon size={20} className="text-primary" weight="duotone" />
        <h2 className="text-xl font-semibold">Sicherheit</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-base">Passwort ändern</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Aktualisiere dein Passwort regelmäßig für erhöhte Sicherheit
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Neues Passwort</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
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

    {/* 4. Gefährlicher Bereich */}
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Warning size={20} className="text-destructive" weight="duotone" />
        <h2 className="text-xl font-semibold text-destructive">Gefährlicher Bereich</h2>
      </div>

      <div className="p-4 border-2 border-destructive/20 rounded-lg bg-destructive/5">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-destructive mb-1">Account löschen</h3>
            <p className="text-sm text-muted-foreground">
              Lösche deinen Account und alle damit verbundenen Daten permanent. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
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
));

export default function Account() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  
  // Get current tab from URL, with fallback to 'sops'
  const currentTab = (() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['sops', 'templates', 'profile'].includes(tabParam) ? tabParam : 'sops';
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
  const [hospitalEmployees, setHospitalEmployees] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalWebsite, setHospitalWebsite] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Account Security State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`first_name, last_name, job_position, avatar_url, hospital_name, hospital_employees, hospital_address, hospital_website, company_logo`)
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
            console.log('Avatar URL from DB:', profile.avatar_url);
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
            setJobPosition(profile.job_position || '');
            // Cache-Buster für Bilder beim Laden hinzufügen
            setAvatarUrl(profile.avatar_url ? `${profile.avatar_url}?t=${Date.now()}` : null);
            setHospitalName(profile.hospital_name || '');
            setHospitalEmployees(profile.hospital_employees || '');
            setHospitalAddress(profile.hospital_address || '');
            setHospitalWebsite(profile.hospital_website || '');
            setCompanyLogo(profile.company_logo ? `${profile.company_logo}?t=${Date.now()}` : null);
          }
        }

        setLoadingDocs(true);
        const { data: docs } = await getDocuments(user.id);
        if (!ignore && docs) {
          setDocuments(docs);
        }
        setLoadingDocs(false);

      } catch (error) {
        console.error('Error loading data!', error);
        setLoadingDocs(false);
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
        avatar_url: avatarUrl,
        hospital_name: hospitalName,
        hospital_employees: hospitalEmployees,
        hospital_address: hospitalAddress,
        hospital_website: hospitalWebsite,
        company_logo: companyLogo,
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

  const uploadCompanyLogo = async (event) => {
    try {
      setUploadingLogo(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Du musst ein Bild auswählen.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-company-logo-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // Cache-Buster hinzufügen, damit der Browser das neue Bild lädt
      const logoUrlWithCacheBuster = `${data.publicUrl}?t=${Date.now()}`;
      console.log('New company logo URL:', logoUrlWithCacheBuster);
      
      setCompanyLogo(logoUrlWithCacheBuster);
      
      const updates = {
        id: user.id,
        company_logo: data.publicUrl, // In DB ohne Cache-Buster speichern
        updated_at: new Date(),
      };
      await supabase.from('profiles').upsert(updates);
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
      setCompanyLogo(null);
      
      const updates = {
        id: user.id,
        company_logo: null,
        updated_at: new Date(),
      };
      await supabase.from('profiles').upsert(updates);
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
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

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

  const handleDeleteAccount = async () => {
    const confirmText = 'Account löschen';
    const userInput = window.prompt(
      `Diese Aktion kann nicht rückgängig gemacht werden!\n\nAlle Ihre Dokumente und Daten werden permanent gelöscht.\n\nGeben Sie "${confirmText}" ein, um fortzufahren:`
    );

    if (userInput !== confirmText) {
      if (userInput !== null) {
        toast.error('Bestätigung fehlgeschlagen');
      }
      return;
    }

    setIsDeletingAccount(true);

    try {
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

      // Dann den Auth-User löschen (über die Admin API oder Self-Service)
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        // Fallback: User ausloggen
        await signOut();
        toast.success('Account-Daten wurden gelöscht');
        window.location.href = '/';
        return;
      }

      toast.success('Account wurde erfolgreich gelöscht');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Fehler beim Löschen des Accounts');
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
                Profil & Einstellungen
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full p-0 transition-all bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center overflow-hidden"
                    title="Mein Konto"
                  >
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Profil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={16} weight="bold" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => changeTab('sops')} className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Meine Leitfäden</span>
                      {documents.length > 0 && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {documents.length}
                        </span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeTab('templates')} className="cursor-pointer">
                      <Layout className="mr-2 h-4 w-4" />
                      <span>SOP Templates</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeTab('profile')} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil & Einstellungen</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => window.open('mailto:feedback@example.com', '_blank')} className="cursor-pointer">
                      <ChatCircleDots className="mr-2 h-4 w-4" />
                      <span>Feedback geben</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open('https://example.com', '_blank')} className="cursor-pointer">
                      <Globe className="mr-2 h-4 w-4" />
                      <span>Webseite</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <SignOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            companyLogo={companyLogo}
            uploadingLogo={uploadingLogo}
            uploadCompanyLogo={uploadCompanyLogo}
            removeCompanyLogo={removeCompanyLogo}
            hospitalName={hospitalName}
            setHospitalName={setHospitalName}
            hospitalEmployees={hospitalEmployees}
            setHospitalEmployees={setHospitalEmployees}
            hospitalWebsite={hospitalWebsite}
            setHospitalWebsite={setHospitalWebsite}
            hospitalAddress={hospitalAddress}
            setHospitalAddress={setHospitalAddress}
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
          </main>
      </div>
    </div>
  );
}
