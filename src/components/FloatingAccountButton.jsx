import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Gear, Moon, Sun, Globe, SignOut, ChatCircleDots } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { useClickOutside } from '../hooks/useClickOutside';

const FloatingAccountButton = ({ isDarkMode, toggleDarkMode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '' });
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useClickOutside([dropdownRef, buttonRef], () => {
    if (showDropdown) setShowDropdown(false);
  }, showDropdown);

  useEffect(() => {
    if (user) {
      getProfile();
    } else {
      setAvatarUrl(null);
      setProfileData({ firstName: '', lastName: '' });
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

  const handleClick = () => {
    if (user) {
      setShowDropdown(!showDropdown);
    } else {
      navigate('/login');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
    navigate('/login');
  };

  const getDisplayName = () => {
    if (profileData.firstName || profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`.trim();
    }
    return 'Benutzer';
  };

  return (
    <div className="fixed top-6 right-6 z-50 no-print">
      <Button
        ref={buttonRef}
        onClick={handleClick}
        className="rounded-full w-10 h-10 p-0 shadow-none hover:shadow-none transition-all bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center overflow-hidden"
        title={user ? "Mein Konto" : "Anmelden"}
      >
        {user && avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Profil" 
            className="w-full h-full object-cover"
          />
        ) : (
          <User size={20} weight="bold" />
        )}
      </Button>

      {/* Dropdown Menu */}
      {showDropdown && user && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 w-64 bg-card rounded-lg shadow-lg border border-border py-2 z-50"
        >
          {/* Profile Section */}
          <div className="px-4 py-3 border-b border-border">
            <div className="font-semibold text-foreground">{getDisplayName()}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{user.email}</div>
            <Button
              onClick={() => {
                navigate('/account');
                setShowDropdown(false);
              }}
              className="w-full mt-3 rounded-md"
              variant="secondary"
            >
              Profil öffnen
            </Button>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                navigate('/account');
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary flex items-center gap-3"
            >
              <Gear size={18} />
              Einstellungen
            </button>

            {/* Theme Toggle */}
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-foreground">
                {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                Darkmode
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isDarkMode ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={() => {
                window.open('mailto:feedback@example.com', '_blank');
              }}
              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary flex items-center gap-3"
            >
              <ChatCircleDots size={18} />
              Feedback geben
            </button>

            <button
              onClick={() => {
                window.open('https://example.com', '_blank');
              }}
              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary flex items-center gap-3"
            >
              <Globe size={18} />
              Webseite
            </button>

            <div className="my-1 border-t border-border"></div>

            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-3"
            >
              <SignOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingAccountButton;
