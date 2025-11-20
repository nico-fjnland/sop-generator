import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { User, FileText, Trash, PencilSimple } from '@phosphor-icons/react';
import { getDocuments, deleteDocument } from '../services/documentService';

export default function Account() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Profile State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [hospital, setHospital] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Documents State
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    let ignore = false;
    
    async function fetchData() {
      setLoading(true);
      try {
        // 1. Load Profile
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

        // 2. Load Documents
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
      
      // Auto-save after upload
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

  const handleDeleteDocument = async (id) => {
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

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-lg shadow border h-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Dein Profil</h2>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            </div>

            <form onSubmit={updateProfile} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center justify-center space-y-4 mb-6">
                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-secondary border-2 border-border">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <User size={48} />
                    </div>
                  )}
                </div>
                <label 
                  htmlFor="avatar-upload" 
                  className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 px-3"
                >
                  {uploading ? 'Lädt hoch...' : 'Bild ändern'}
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

              <div className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-foreground">Vorname</label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-foreground">Nachname</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="jobPosition" className="block text-sm font-medium text-foreground">Position</label>
                  <input
                    id="jobPosition"
                    type="text"
                    value={jobPosition}
                    onChange={(e) => setJobPosition(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="hospital" className="block text-sm font-medium text-foreground">Krankenhaus</label>
                  <input
                    id="hospital"
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex flex-col gap-2">
                <Button type="submit" disabled={updating} className="w-full">
                  {updating ? 'Speichert...' : 'Profil speichern'}
                </Button>
                <Button type="button" variant="destructive" onClick={handleSignOut} className="w-full">
                  Abmelden
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Documents */}
        <div className="lg:col-span-2">
          <div className="bg-card p-6 rounded-lg shadow border min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FileText size={24} />
                Meine SOPs
              </h2>
              <Button onClick={() => navigate('/?new=true')} variant="secondary">
                Neues Dokument erstellen
              </Button>
            </div>

            {loadingDocs ? (
              <div className="text-center py-12 text-muted-foreground">Lade Dokumente...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">Keine Dokumente gefunden</p>
                <p className="text-sm text-muted-foreground mt-1">Erstelle deine erste SOP im Editor.</p>
                <Button onClick={() => navigate('/')} className="mt-4">
                  Zum Editor
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/10 transition-colors group">
                    <div className="flex-1 min-w-0 mr-4 cursor-pointer" onClick={() => handleOpenDocument(doc.id)}>
                      <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {doc.title || 'Unbenanntes Dokument'}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="bg-secondary px-2 py-0.5 rounded text-xs font-mono">
                          {doc.version || 'v1.0'}
                        </span>
                        <span>
                          Zuletzt bearbeitet: {new Date(doc.updated_at).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleOpenDocument(doc.id)}
                        title="Bearbeiten"
                      >
                        <PencilSimple size={20} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Löschen"
                      >
                        <Trash size={20} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
