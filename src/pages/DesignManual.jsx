import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Palette, TextAa, Layout, PuzzlePiece, Ruler, CornersOut, ArrowLeft, FileText, User } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { getDocuments } from '../services/documentService';

const DesignManual = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get editor gradient preference
  const [editorGradient, setEditorGradient] = useState(() => {
    const saved = localStorage.getItem('editorGradient');
    return saved || 'light';
  });

  // Documents count for sidebar - read from cache immediately
  const [documentsCount, setDocumentsCount] = useState(() => {
    const cached = localStorage.getItem('documentsCount');
    return cached ? parseInt(cached, 10) : 0;
  });

  // Listen for changes to editorGradient in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('editorGradient');
      setEditorGradient(saved || 'light');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load documents count
  useEffect(() => {
    if (user) {
      loadDocumentsCount();
    }
  }, [user]);

  async function loadDocumentsCount() {
    try {
      const { data } = await getDocuments(user.id);
      if (data) {
        const count = data.length;
        setDocumentsCount(count);
        localStorage.setItem('documentsCount', count.toString());
      }
    } catch (error) {
      console.error('Error loading documents count:', error);
    }
  }
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
    { 
      category: 'Blue Shades',
      colors: [
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
      ]
    },
    {
      category: 'Red (Definition)',
      colors: [
        { name: 'Dark Red', hex: '#8A1A0F', text: 'white' },
        { name: 'Primary Red', hex: '#EB5547', text: 'white' },
        { name: 'Light Red', hex: '#FCEAE8', text: 'black' },
      ]
    },
    {
      category: 'Green (Therapie)',
      colors: [
        { name: 'Dark Green', hex: '#23631D', text: 'white' },
        { name: 'Primary Green', hex: '#57CB4D', text: 'black' },
        { name: 'Light Green', hex: '#ECF9EB', text: 'black' },
      ]
    },
    {
      category: 'Yellow (Disposition)',
      colors: [
        { name: 'Dark Yellow', hex: '#B27700', text: 'white' },
        { name: 'Primary Yellow', hex: '#FFBB33', text: 'black' },
        { name: 'Light Yellow', hex: '#FFF7E6', text: 'black' },
      ]
    },
    {
      category: 'Petrol (Algorithmus)',
      colors: [
        { name: 'Dark Petrol', hex: '#1F7A73', text: 'white' },
        { name: 'Primary Petrol', hex: '#47D1C6', text: 'black' },
        { name: 'Light Petrol', hex: '#EBFAF9', text: 'black' },
      ]
    },
    {
      category: 'Violett (Differential)',
      colors: [
        { name: 'Dark Violett', hex: '#4D0891', text: 'white' },
        { name: 'Primary Violett', hex: '#993DF5', text: 'white' },
        { name: 'Light Violett', hex: '#F5ECFE', text: 'black' },
      ]
    },
    {
      category: 'Grey (Sonstige)',
      colors: [
        { name: 'Dark Grey', hex: '#B3B3B3', text: 'black' },
        { name: 'Primary Grey', hex: '#EDEDED', text: 'black' },
        { name: 'Light Grey', hex: '#F4F4F4', text: 'black' },
      ]
    }
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
    <div className={`min-h-screen ${editorGradient === 'light' ? 'light-gradient-bg' : 'dark-gradient-bg dark'} transition-colors duration-200`}>
      <div className="flex min-h-screen p-6 gap-6">
        {/* Sidebar - Box style like ZoomBar */}
        <aside className="w-64 flex-shrink-0 no-print">
          <div className="sticky top-6 bg-white rounded-lg shadow-md border border-border overflow-hidden">
            <div className="h-[calc(100vh-3rem)] overflow-y-auto py-8 px-4">
            <div className="space-y-6">
              {/* Back to Editor */}
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={16} />
                Zurück zum Editor
              </Button>

              <Separator />

              {/* Navigation */}
              <nav className="space-y-1">
                <button
                  onClick={() => navigate('/account?tab=sops')}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} weight="regular" />
                    <span>Meine Leitfäden</span>
                  </div>
                  {documentsCount > 0 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {documentsCount}
                    </span>
                  ) : (
                    <span className="w-0"></span>
                  )}
                </button>
                <button
                  onClick={() => navigate('/account?tab=templates')}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Layout size={18} weight="regular" />
                    <span>SOP Templates</span>
                  </div>
                  <span className="w-0"></span>
                </button>
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Palette size={18} weight="fill" />
                    <span>Design Manual</span>
                  </div>
                  <span className="w-0"></span>
                </button>
              </nav>

              <Separator />

              {/* Settings Section */}
              <nav className="space-y-1">
                <button
                  onClick={() => navigate('/account?tab=profile')}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <User size={18} weight="regular" />
                    <span>Profil & Einstellungen</span>
                  </div>
                  <span className="w-0"></span>
                </button>
              </nav>
            </div>
            </div>
          </div>
        </aside>

        {/* Main Content - Aligned near sidebar */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-5xl pt-12 pb-8 px-8 space-y-12">

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Design Manual</h1>
          <p className="text-muted-foreground">
            Übersicht über alle verwendeten Styles, UI-Elemente und Design-Tokens dieser Anwendung.
          </p>
        </div>

      {/* Colors Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b pb-3">
          <Palette size={24} weight="duotone" className="text-primary" />
          <h2 className="text-2xl font-semibold">Farben</h2>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Theme Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {colors.map((color) => (
              <div key={color.name} className="space-y-2">
                <div className={`h-24 w-full rounded-md shadow-sm flex items-center justify-center border ${color.class}`}>
                  <span className="font-medium">{color.name}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-mono">{color.class.split(' ')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">SOP Color System</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sopColors.flatMap((group) => group.colors).map((color) => (
              <div key={color.hex} className="space-y-2">
                <div 
                  className="h-24 w-full rounded-md shadow-sm flex items-center justify-center border"
                  style={{ backgroundColor: color.hex, color: color.text }}
                >
                  <span className="font-medium">{color.name}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-mono uppercase">{color.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Background Gradients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-24 w-full rounded-md shadow-sm border light-gradient-bg flex items-center justify-center text-foreground">
                <span className="font-medium">Light Gradient</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">.light-gradient-bg</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 w-full rounded-md shadow-sm border dark-gradient-bg dark flex items-center justify-center text-white">
                <span className="font-medium">Dark Gradient</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">.dark-gradient-bg</p>
            </div>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b pb-3">
          <TextAa size={24} weight="duotone" className="text-primary" />
          <h2 className="text-2xl font-semibold">Typografie</h2>
        </div>
        
        <div className="grid gap-8">
          {typography.map((type, index) => (
            <div key={index} className="space-y-2">
              <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded w-fit">
                {type.description}
              </div>
              <div className="p-4 border rounded-lg bg-card">
                {type.element}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Components Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b pb-3">
          <PuzzlePiece size={24} weight="duotone" className="text-primary" />
          <h2 className="text-2xl font-semibold">UI-Komponenten</h2>
        </div>
        
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Buttons</h3>
            <div className="flex flex-wrap gap-4 p-6 border rounded-lg bg-card items-center">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b pb-3">
          <Ruler size={24} weight="duotone" className="text-primary" />
          <h2 className="text-2xl font-semibold">Abstände</h2>
        </div>
        
        <div className="flex flex-wrap items-end gap-4 p-6 border rounded-lg bg-card">
          {[4, 8, 12, 16, 20, 24, 32, 40, 48, 64].map((space) => (
            <div key={space} className="space-y-2 text-center">
              <div 
                className="bg-primary/20 border border-primary/50 mx-auto rounded"
                style={{ width: '2rem', height: `${space/4}rem` }}
              />
              <span className="text-xs text-muted-foreground font-mono">{space}px ({space/4})</span>
            </div>
          ))}
        </div>
      </section>

      {/* Border Radius Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b pb-3">
          <CornersOut size={24} weight="duotone" className="text-primary" />
          <h2 className="text-2xl font-semibold">Eckenradien</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-8 p-6 border rounded-lg bg-card">
          <div className="space-y-2 text-center">
            <div className="w-24 h-24 bg-primary/20 border-2 border-primary mx-auto rounded-none flex items-center justify-center">
              <span className="text-xs font-mono">0px</span>
            </div>
            <span className="text-sm font-medium">None</span>
            <p className="text-xs text-muted-foreground font-mono">rounded-none</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="w-24 h-24 bg-primary/20 border-2 border-primary mx-auto rounded-sm flex items-center justify-center">
              <span className="text-xs font-mono">2px</span>
            </div>
            <span className="text-sm font-medium">Small</span>
            <p className="text-xs text-muted-foreground font-mono">rounded-sm</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="w-24 h-24 bg-primary/20 border-2 border-primary mx-auto rounded flex items-center justify-center">
              <span className="text-xs font-mono">4px</span>
            </div>
            <span className="text-sm font-medium">Default</span>
            <p className="text-xs text-muted-foreground font-mono">rounded</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="w-24 h-24 bg-primary/20 border-2 border-primary mx-auto rounded-md flex items-center justify-center">
              <span className="text-xs font-mono">6px</span>
            </div>
            <span className="text-sm font-medium">Medium</span>
            <p className="text-xs text-muted-foreground font-mono">rounded-md</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="w-24 h-24 bg-primary/20 border-2 border-primary mx-auto rounded-lg flex items-center justify-center">
              <span className="text-xs font-mono">8px</span>
            </div>
            <span className="text-sm font-medium">Large</span>
            <p className="text-xs text-muted-foreground font-mono">rounded-lg</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="w-24 h-24 bg-primary/20 border-2 border-primary mx-auto rounded-xl flex items-center justify-center">
              <span className="text-xs font-mono">12px</span>
            </div>
            <span className="text-sm font-medium">Extra Large</span>
            <p className="text-xs text-muted-foreground font-mono">rounded-xl</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="w-24 h-24 bg-primary/20 border-2 border-primary mx-auto rounded-2xl flex items-center justify-center">
              <span className="text-xs font-mono">16px</span>
            </div>
            <span className="text-sm font-medium">2X Large</span>
            <p className="text-xs text-muted-foreground font-mono">rounded-2xl</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="w-24 h-24 bg-primary/20 border-2 border-primary mx-auto rounded-full flex items-center justify-center">
              <span className="text-xs font-mono">9999px</span>
            </div>
            <span className="text-sm font-medium">Full</span>
            <p className="text-xs text-muted-foreground font-mono">rounded-full</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="pt-8 border-t">
        <p className="text-sm text-muted-foreground text-center">
          Diese Design-Elemente werden konsistent in der gesamten Anwendung verwendet.
        </p>
      </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DesignManual;

