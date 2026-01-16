import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { logger } from '../utils/logger';
import { 
  User, FileText, Layout, SignOut, ChatCircleDots, Globe, Moon, Sun, Buildings,
  IdentificationCard, ShieldCheck, Scroll, ListChecks, Scales, ArrowUpRight
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
  organization = null,
  profile = null,
  onTabChange, // Optional: (tab) => void. If not provided, uses window.location
  dropdownPosition = 'right', // 'right' oder 'bottom'
  size = 'default' // 'default' (h-8) oder 'lg' (h-10)
}) => {
  const { timeOfDay, toggleTime } = useTheme();

  // Navigation handler that works reliably with Radix UI Portals
  const handleNavigation = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      // Use window.location for reliable navigation from Portal
      window.location.href = `/account?tab=${tab}`;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      logger.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full p-0 transition-all bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center overflow-hidden ${size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'}`}
          title="Mein Konto"
        >
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Profil" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={size === 'lg' ? 24 : 16} weight="bold" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-64" 
        side={dropdownPosition === 'bottom' ? 'bottom' : 'right'}
        align={dropdownPosition === 'bottom' ? 'end' : 'start'}
        sideOffset={dropdownPosition === 'bottom' ? 8 : 16}
        alignOffset={dropdownPosition === 'bottom' ? 0 : -8}
        collisionPadding={{ top: 24, right: 24, bottom: 24, left: 24 }} 
        avoidCollisions={true}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => handleNavigation('sops')} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            <span>Meine Leitfäden</span>
            {documentsCount > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {documentsCount}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleNavigation('templates')} className="cursor-pointer">
            <Layout className="mr-2 h-4 w-4" />
            <span>SOP Templates</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleNavigation('profile')} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleNavigation('organization')} className="cursor-pointer">
            <Buildings className="mr-2 h-4 w-4" />
            <span>Organisation</span>
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
          <DropdownMenuItem onSelect={() => {
            if (window.Beacon && user?.email) {
              // Build identify object with only non-empty values
              // Empty strings can cause 400 errors in Helpscout
              const identifyData = { email: user.email };
              if (displayName) identifyData.name = displayName;
              if (organization?.name) identifyData.company = organization.name;
              // Avatar: only include if valid URL (avatarUrl may have cache-buster ?t=...)
              if (avatarUrl && avatarUrl.startsWith('http')) {
                // Remove cache-buster for Helpscout (use clean URL)
                identifyData.avatar = avatarUrl.split('?')[0];
              }
              if (profile?.job_position) identifyData.jobTitle = profile.job_position;
              
              window.Beacon('identify', identifyData);
              window.Beacon('open');
              window.Beacon('navigate', '/ask/');
            } else if (window.Beacon) {
              // Fallback: just open without identify
              window.Beacon('open');
              window.Beacon('navigate', '/ask/');
            }
          }} className="cursor-pointer">
            <ChatCircleDots className="mr-2 h-4 w-4" />
            <span>Feedback geben</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open('https://sop-notaufnahme.de', '_blank')} className="cursor-pointer">
            <Globe className="mr-2 h-4 w-4" />
            <span>Zur SOP Webseite</span>
            <ArrowUpRight className="ml-auto h-3 w-3 text-muted-foreground" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => window.open('https://sop-notaufnahme.de/legal/impressum', '_blank')} className="cursor-pointer">
            <IdentificationCard className="mr-2 h-4 w-4" />
            <span>Impressum</span>
            <ArrowUpRight className="ml-auto h-3 w-3 text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open('https://sop-notaufnahme.de/legal/datenschutz', '_blank')} className="cursor-pointer">
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Datenschutz</span>
            <ArrowUpRight className="ml-auto h-3 w-3 text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open('https://sop-notaufnahme.de/legal/agb', '_blank')} className="cursor-pointer">
            <Scroll className="mr-2 h-4 w-4" />
            <span>Geschäftsbedingungen</span>
            <ArrowUpRight className="ml-auto h-3 w-3 text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open('https://sop-notaufnahme.de/legal/editor', '_blank')} className="cursor-pointer">
            <ListChecks className="mr-2 h-4 w-4" />
            <span>Nutzungsbedingungen</span>
            <ArrowUpRight className="ml-auto h-3 w-3 text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open('https://sop-notaufnahme.de/legal/compliance', '_blank')} className="cursor-pointer">
            <Scales className="mr-2 h-4 w-4" />
            <span>Compliance</span>
            <ArrowUpRight className="ml-auto h-3 w-3 text-muted-foreground" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
          <SignOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountDropdown;

