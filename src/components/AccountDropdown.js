import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  User, FileText, Layout, SignOut, ChatCircleDots, Globe, Moon, Sun 
} from '@phosphor-icons/react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from './ui/dropdown-menu';

const AccountDropdown = ({ 
  user, 
  signOut, 
  displayName, 
  avatarUrl, 
  documentsCount = 0,
  onTabChange // Optional: (tab) => void. If not provided, uses navigate
}) => {
  const navigate = useNavigate();
  const { timeOfDay, toggleTime } = useTheme();

  const handleNavigation = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      navigate(`/account?tab=${tab}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/');
    }
  };

  return (
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
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleNavigation('sops')} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            <span>Meine Leitfäden</span>
            {documentsCount > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {documentsCount}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigation('templates')} className="cursor-pointer">
            <Layout className="mr-2 h-4 w-4" />
            <span>SOP Templates</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigation('profile')} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profil & Einstellungen</span>
          </DropdownMenuItem>
          
          {/* Theme Toggle */}
          <div 
            className="flex items-center justify-between px-2 py-1.5 text-sm select-none outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors mt-1"
            onClick={(e) => { e.preventDefault(); toggleTime(); }}
          >
            <div className="flex items-center">
              {timeOfDay === 'night' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
              <span>{timeOfDay === 'day' ? 'Tagmodus' : 'Nachtmodus'}</span>
            </div>
            <Switch 
              checked={timeOfDay === 'night'} 
              className="data-[state=checked]:bg-primary scale-90 pointer-events-none"
            />
          </div>
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
  );
};

export default AccountDropdown;

