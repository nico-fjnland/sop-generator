import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { 
  User, 
  FileText, 
  Copy, 
  SignOut, 
  Plus, 
  Trash, 
  PencilSimple,
  Upload
} from '@phosphor-icons/react';
import { getDocuments, deleteDocument, saveDocument } from '../services/documentService';
import { importFromJson } from '../utils/exportUtils';

export default function Account({ isDarkMode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  
  // UI State - Initialize from URL parameter
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['sops', 'templates', 'profile'].includes(tabParam) ? tabParam : 'sops';
  });

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
      alert('Profil aktualisiert!');
    } catch (error) {
      alert('Fehler beim Aktualisieren des Profils!');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const updateEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || newEmail === user.email) {
      alert('Bitte gib eine neue E-Mail-Adresse ein.');
      return;
    }

    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      alert('E-Mail-Adresse aktualisiert! Bitte überprüfe deine neue E-Mail für die Bestätigung.');
      setNewEmail('');
    } catch (error) {
      alert('Fehler beim Aktualisieren der E-Mail: ' + error.message);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      alert('Bitte gib ein neues Passwort ein.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwörter stimmen nicht überein.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Passwort erfolgreich aktualisiert!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert('Fehler beim Aktualisieren des Passworts: ' + error.message);
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

    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Möchtest du dieses Dokument wirklich löschen?')) {
      const { success } = await deleteDocument(id);
      if (success) {
        setDocuments(documents.filter(doc => doc.id !== id));
      } else {
        alert('Fehler beim Löschen des Dokuments');
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
      const importedState = importFromJson(text);
      
      if (!importedState) {
        alert('Fehler beim Importieren: Ungültige JSON-Datei');
        return;
      }

      // Save the imported document to the database
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
        alert('Fehler beim Speichern des importierten Dokuments');
        return;
      }

      // Refresh documents list
      const { data: docs } = await getDocuments(user.id);
      if (docs) {
        setDocuments(docs);
      }

      alert('Dokument erfolgreich importiert!');
    } catch (error) {
      console.error('Import error:', error);
      alert('Fehler beim Importieren der Datei');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  // Color utilities
  const textPrimary = isDarkMode ? 'text-white' : 'text-[#003366]';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-[#003366]/60';
  const bgSecondary = isDarkMode ? 'bg-gray-800' : 'bg-[#003366]/5';
  const border = isDarkMode ? 'border-gray-700' : 'border-[#003366]/10';
  const hoverBg = isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-[#003366]/5';

  // --- Sub-Components ---

  const SidebarItem = ({ id, icon, label, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        activeTab === id 
          ? isDarkMode ? 'bg-white text-black' : 'bg-[#003366] text-white'
          : `${textSecondary} ${hoverBg} ${isDarkMode ? 'hover:text-white' : 'hover:text-[#003366]'}`
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          activeTab === id 
            ? isDarkMode ? 'bg-black/20 text-black' : 'bg-white/30 text-white'
            : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-[#003366]/10 text-[#003366]/60'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  // --- Views ---

  const SopsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-semibold ${textPrimary}`}>Meine Leitfäden</h1>
        <div className="flex items-center gap-2">
          <Button onClick={triggerImport} size="sm" variant="secondary" className="gap-2">
            <Upload size={16} />
            Importieren
          </Button>
          <Button onClick={() => navigate('/?new=true')} size="sm" className="gap-2">
            <Plus size={16} />
            Neu
          </Button>
        </div>
      </div>

      {loadingDocs ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-20 ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-200/30'} rounded-lg animate-pulse`}></div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className={`text-center py-16 border border-dashed ${border} rounded-lg`}>
          <FileText size={40} className={`mx-auto ${textSecondary} mb-3 opacity-40`} />
          <p className={`text-sm ${textSecondary}`}>Noch keine Dokumente vorhanden</p>
          <Button onClick={() => navigate('/?new=true')} variant="secondary" size="sm" className="mt-4">
            Erstes Dokument erstellen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              onClick={() => handleOpenDocument(doc.id)}
              className={`group flex items-center justify-between p-4 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-800/80' : 'bg-white hover:shadow-md'} rounded-2xl cursor-pointer transition-all`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`flex-shrink-0 w-12 h-12 ${isDarkMode ? 'bg-gray-700' : 'bg-[#003366]/5'} rounded-full flex items-center justify-center`}>
                  <FileText size={20} className={isDarkMode ? 'text-gray-400' : 'text-[#003366]'} weight="regular" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${textPrimary} truncate`}>
                    {doc.title || 'Unbenanntes Dokument'}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#B3B3B3]">
                      {doc.version || 'v1.0'}
                    </span>
                    <span className="text-xs text-[#B3B3B3]">
                      {new Date(doc.updated_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenDocument(doc.id); }}
                  className="p-2.5 bg-[#3399FF] text-white rounded-full hover:bg-[#3399FF]/90 transition-colors"
                  title="Bearbeiten"
                >
                  <PencilSimple size={16} weight="bold" />
                </button>
                <button 
                  onClick={(e) => handleDeleteDocument(doc.id, e)}
                  className="p-2.5 bg-[#3399FF] text-white rounded-full hover:bg-[#3399FF]/90 transition-colors"
                  title="Löschen"
                >
                  <Trash size={16} weight="bold" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const TemplatesView = () => (
    <div className="space-y-6">
      <h1 className={`text-2xl font-semibold ${textPrimary}`}>SOP Templates</h1>
      
      <div className={`text-center py-16 border border-dashed ${border} rounded-lg`}>
        <Copy size={40} className={`mx-auto ${textSecondary} mb-3 opacity-40`} />
        <p className={`text-sm ${textSecondary}`}>Demnächst verfügbar</p>
      </div>
    </div>
  );

  const ProfileView = () => (
    <div className="space-y-6 max-w-2xl">
      <h1 className={`text-2xl font-semibold ${textPrimary}`}>Profil & Einstellungen</h1>

      <form onSubmit={updateProfile} className="space-y-8">
        {/* Avatar Section */}
        <div className={`flex items-center gap-6 pb-6 border-b ${border}`}>
          <div className="relative">
            <div className={`h-20 w-20 rounded-full overflow-hidden ${bgSecondary} border ${border}`}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className={`h-full w-full flex items-center justify-center ${textSecondary}`}>
                  <User size={32} />
                </div>
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className={`absolute bottom-0 right-0 ${isDarkMode ? 'bg-white text-black' : 'bg-[#003366] text-white'} p-1.5 rounded-full cursor-pointer hover:opacity-90 transition-opacity`}
              title="Bild ändern"
            >
              <PencilSimple size={12} weight="bold" />
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
          <div>
            <p className={`font-medium ${textPrimary}`}>
              {firstName || lastName ? `${firstName} ${lastName}` : 'Benutzer'}
            </p>
            <p className={`text-sm ${textSecondary} mt-0.5`}>{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="firstName" className={`text-sm font-medium ${textPrimary}`}>Vorname</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full rounded-md border ${border} ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-[#003366]'} px-3 py-2 text-sm focus:ring-1 ${isDarkMode ? 'focus:ring-white' : 'focus:ring-[#003366]'} focus:outline-none`}
              placeholder="Max"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className={`text-sm font-medium ${textPrimary}`}>Nachname</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full rounded-md border ${border} ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-[#003366]'} px-3 py-2 text-sm focus:ring-1 ${isDarkMode ? 'focus:ring-white' : 'focus:ring-[#003366]'} focus:outline-none`}
              placeholder="Mustermann"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="jobPosition" className={`text-sm font-medium ${textPrimary}`}>Position</label>
            <input
              id="jobPosition"
              type="text"
              value={jobPosition}
              onChange={(e) => setJobPosition(e.target.value)}
              className={`w-full rounded-md border ${border} ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-[#003366]'} px-3 py-2 text-sm focus:ring-1 ${isDarkMode ? 'focus:ring-white' : 'focus:ring-[#003366]'} focus:outline-none`}
              placeholder="Assistenzarzt"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="hospital" className={`text-sm font-medium ${textPrimary}`}>Krankenhaus</label>
            <input
              id="hospital"
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              className={`w-full rounded-md border ${border} ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-[#003366]'} px-3 py-2 text-sm focus:ring-1 ${isDarkMode ? 'focus:ring-white' : 'focus:ring-[#003366]'} focus:outline-none`}
              placeholder="Klinikum Berlin"
            />
          </div>
        </div>

        <div className={`pt-4 border-t ${border}`}>
          <Button type="submit" disabled={updating}>
            {updating ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </Button>
        </div>
      </form>

      {/* Account Security Section */}
      <div className="space-y-6 mt-8">
        <h2 className={`text-xl font-semibold ${textPrimary}`}>Sicherheit</h2>

        {/* Change Email */}
        <form onSubmit={updateEmail} className={`space-y-4 p-4 border ${border} rounded-lg`}>
          <h3 className={`text-sm font-medium ${textPrimary}`}>E-Mail-Adresse ändern</h3>
          <p className={`text-xs ${textSecondary}`}>Aktuelle E-Mail: {user.email}</p>
          <div className="space-y-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={`w-full rounded-md border ${border} ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-[#003366]'} px-3 py-2 text-sm focus:ring-1 ${isDarkMode ? 'focus:ring-white' : 'focus:ring-[#003366]'} focus:outline-none`}
              placeholder="Neue E-Mail-Adresse"
            />
          </div>
          <Button type="submit" size="sm" disabled={updatingEmail}>
            {updatingEmail ? 'Wird aktualisiert...' : 'E-Mail ändern'}
          </Button>
        </form>

        {/* Change Password */}
        <form onSubmit={updatePassword} className={`space-y-4 p-4 border ${border} rounded-lg`}>
          <h3 className={`text-sm font-medium ${textPrimary}`}>Passwort ändern</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full rounded-md border ${border} ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-[#003366]'} px-3 py-2 text-sm focus:ring-1 ${isDarkMode ? 'focus:ring-white' : 'focus:ring-[#003366]'} focus:outline-none`}
                placeholder="Neues Passwort"
              />
            </div>
            <div className="space-y-2">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-md border ${border} ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-[#003366]'} px-3 py-2 text-sm focus:ring-1 ${isDarkMode ? 'focus:ring-white' : 'focus:ring-[#003366]'} focus:outline-none`}
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
    <div className={`fixed inset-0 overflow-auto light-gradient-bg dark-gradient-bg ${isDarkMode ? 'dark' : ''}`}>
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJson}
        className="hidden"
        accept=".json"
      />
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-20">
          
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0 space-y-8">
            {/* User Info */}
            <div className="flex items-center gap-3 px-2">
              <div className={`h-10 w-10 rounded-full ${bgSecondary} flex items-center justify-center overflow-hidden`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User size={20} className={textSecondary} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${textPrimary} truncate`}>
                  {firstName ? `${firstName} ${lastName}` : user.email.split('@')[0]}
                </p>
                <p className={`text-xs ${textSecondary} truncate`}>{user.email}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              <SidebarItem 
                id="sops" 
                icon={<FileText size={18} />} 
                label="Meine Leitfäden" 
                count={documents.length} 
              />
              <SidebarItem 
                id="templates" 
                icon={<Copy size={18} />} 
                label="SOP Templates" 
              />
              <div className={`my-4 border-t ${border} mx-4`}></div>
              <SidebarItem 
                id="profile" 
                icon={<User size={18} />} 
                label="Profil & Einstellungen" 
              />
            </nav>

            {/* Logout */}
            <div className="pt-4">
              <button 
                onClick={handleSignOut}
                className={`flex items-center gap-2 px-4 text-sm ${textSecondary} ${isDarkMode ? 'hover:text-white' : 'hover:text-[#003366]'} transition-colors`}
              >
                <SignOut size={18} />
                Abmelden
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-4xl">
            {activeTab === 'sops' && <SopsView />}
            {activeTab === 'templates' && <TemplatesView />}
            {activeTab === 'profile' && <ProfileView />}
          </main>

        </div>
      </div>
    </div>
  );
}
