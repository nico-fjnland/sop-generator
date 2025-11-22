import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Globe, SignOut, ChatCircleDots, FileText, Layout, Palette } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { getDocuments } from '../services/documentService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from './ui/dropdown-menu';

const FloatingAccountButton = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '' });
  const [documentsCount, setDocumentsCount] = useState(0);

  useEffect(() => {
    if (user) {
      getProfile();
      loadDocumentsCount();
    } else {
      setAvatarUrl(null);
      setProfileData({ firstName: '', lastName: '' });
      setDocumentsCount(0);
    }
  }, [user]);

  async function getProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (data) {
        setAvatarUrl(data.avatar_url);
        setProfileData({
          firstName: data.first_name || '',
          lastName: data.last_name || ''
        });
      }
    } catch (error) {
      console.error('Error loading avatar for button:', error);
    }
  }

  async function loadDocumentsCount() {
    try {
      const { data, error } = await getDocuments(user.id);
      if (data) {
        const count = data.length;
        setDocumentsCount(count);
        localStorage.setItem('documentsCount', count.toString());
      }
    } catch (error) {
      console.error('Error loading documents count:', error);
    }
  }

  const handleClick = () => {
    if (!user) {
      navigate('/login');
    }
  };

  const handleSignOut = async () => {
    try {
      // Lokale Daten löschen
      localStorage.removeItem('documentsCount');
      
      const { error } = await signOut();
      
      // Wenn die Session fehlt, ist der Benutzer bereits ausgeloggt
      if (error && error.message === 'Auth session missing!') {
        window.location.href = '/';
        return;
      }
      
      if (error) {
        console.error('Logout error:', error);
        return;
      }
      
      // Erfolgreicher Logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout exception:', error);
      // Auch bei Exceptions zur Startseite navigieren
      window.location.href = '/';
    }
  };

  const getDisplayName = () => {
    if (profileData.firstName || profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`.trim();
    }
    return 'Benutzer';
  };

  if (!user) {
    return (
      <div className="fixed top-6 right-6 z-50 no-print">
        <Button
          onClick={handleClick}
          className="rounded-full w-[50px] h-[50px] p-0 transition-all bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center overflow-hidden"
          title="Anmelden"
        >
          <User size={28} weight="bold" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-6 right-6 z-50 no-print">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
      <Button
            className="rounded-full w-[50px] h-[50px] p-0 transition-all bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center overflow-hidden"
            title="Mein Konto"
      >
            {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Profil" 
            className="w-full h-full object-cover"
          />
        ) : (
              <User size={28} weight="bold" />
        )}
      </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount collisionPadding={{ top: 24, right: 24, bottom: 24, left: 24 }} avoidCollisions={true}>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => navigate('/account?tab=sops')} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              <span>Meine Leitfäden</span>
              {documentsCount > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {documentsCount}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/account?tab=templates')} className="cursor-pointer">
              <Layout className="mr-2 h-4 w-4" />
              <span>SOP Templates</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/account?tab=design-manual')} className="cursor-pointer">
              <Palette className="mr-2 h-4 w-4" />
              <span>Design Manual</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/account?tab=profile')} className="cursor-pointer">
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
  );
};

export default FloatingAccountButton;
