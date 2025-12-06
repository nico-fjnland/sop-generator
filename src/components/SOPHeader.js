import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trash, Image } from '@phosphor-icons/react';

const SOPHeader = ({ title: initialTitle = 'SOP Überschrift', stand: initialStand = 'STAND 12/22', logo: initialLogo = null, onTitleChange, onStandChange, onLogoChange }) => {
  const { user, organization, organizationId } = useAuth();
  const [title, setTitle] = useState(initialTitle);
  const [stand, setStand] = useState(initialStand);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingStand, setIsEditingStand] = useState(false);
  const [logo, setLogo] = useState(initialLogo);
  const [companyLogo, setCompanyLogo] = useState(null);
  const titleInputRef = useRef(null);
  const standInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // Load company logo from organization
  useEffect(() => {
    if (organization?.logo_url) {
      setCompanyLogo(organization.logo_url);
    } else {
      setCompanyLogo(null);
    }
  }, [organization]);

  // Set up real-time subscription for organization changes
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel('organization-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'organizations',
          filter: `id=eq.${organizationId}`
        },
        (payload) => {
          if (payload.new && payload.new.logo_url !== undefined) {
            setCompanyLogo(payload.new.logo_url);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    setStand(initialStand);
  }, [initialStand]);

  useEffect(() => {
    setLogo(initialLogo);
  }, [initialLogo]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
      // Ensure minimum height on focus
      titleInputRef.current.style.height = 'auto';
      const newHeight = Math.max(titleInputRef.current.scrollHeight, 38.4);
      titleInputRef.current.style.height = newHeight + 'px';
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingStand && standInputRef.current) {
      standInputRef.current.focus();
      standInputRef.current.select();
    }
  }, [isEditingStand]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (onTitleChange) {
      onTitleChange(title);
    }
  };

  const handleTitleKeyDown = (e) => {
    // Allow Shift+Enter for manual line breaks
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTitleBlur();
    }
    // Shift+Enter will create a line break (default textarea behavior)
  };

  const handleStandBlur = () => {
    setIsEditingStand(false);
    if (onStandChange) {
      onStandChange(stand);
    }
  };

  const handleStandKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStandBlur();
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoUrl = reader.result;
        setLogo(logoUrl);
        if (onLogoChange) {
          onLogoChange(logoUrl);
        }
        // Reset the input value to allow uploading the same file again
        if (logoInputRef.current) {
          logoInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="sop-header mb-4" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      width: '100%',
      paddingTop: '8px',
      paddingBottom: '8px',
      paddingLeft: '14px',
      paddingRight: '14px',
      gap: '24px'
    }}>
      {/* Left side: Version and Title */}
      <div className="flex flex-col gap-0" style={{ flex: '1', minWidth: 0 }}>
        {/* Version */}
        <div className="flex items-center gap-1" style={{ 
          paddingLeft: '8px',
          width: '100%'
        }}>
          {/* Icon - visible in both editor and print */}
          <div className="no-print" style={{ width: '11px', height: '11px', flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5074 9.40876V6.47007H9.46308C9.75074 6.40489 10.0076 6.2445 10.1916 6.01518C10.3756 5.78586 10.4758 5.5012 10.4758 5.20785C10.4758 4.91449 10.3756 4.62983 10.1916 4.40051C10.0076 4.17119 9.75074 4.0108 9.46308 3.94562H6.5074V1.00693C6.44184 0.720913 6.28053 0.465496 6.04988 0.282558C5.81924 0.0996201 5.53289 0 5.23785 0C4.94281 0 4.65654 0.0996201 4.42589 0.282558C4.19525 0.465496 4.03394 0.720913 3.96838 1.00693V3.94562H1.0127C0.725032 4.0108 0.468181 4.17119 0.284188 4.40051C0.100195 4.62983 0 4.91449 0 5.20785C0 5.5012 0.100195 5.78586 0.284188 6.01518C0.468181 6.2445 0.725032 6.40489 1.0127 6.47007H3.96838V9.40876C4.03394 9.69478 4.19525 9.9502 4.42589 10.1331C4.65654 10.3161 4.94281 10.4157 5.23785 10.4157C5.53289 10.4157 5.81924 10.3161 6.04988 10.1331C6.28053 9.9502 6.44184 9.69478 6.5074 9.40876Z" fill="#3399FF"/>
            </svg>
          </div>
          {/* Icon for print */}
          <div className="hidden print:block" style={{ width: '11px', height: '11px', flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5074 9.40876V6.47007H9.46308C9.75074 6.40489 10.0076 6.2445 10.1916 6.01518C10.3756 5.78586 10.4758 5.5012 10.4758 5.20785C10.4758 4.91449 10.3756 4.62983 10.1916 4.40051C10.0076 4.17119 9.75074 4.0108 9.46308 3.94562H6.5074V1.00693C6.44184 0.720913 6.28053 0.465496 6.04988 0.282558C5.81924 0.0996201 5.53289 0 5.23785 0C4.94281 0 4.65654 0.0996201 4.42589 0.282558C4.19525 0.465496 4.03394 0.720913 3.96838 1.00693V3.94562H1.0127C0.725032 4.0108 0.468181 4.17119 0.284188 4.40051C0.100195 4.62983 0 4.91449 0 5.20785C0 5.5012 0.100195 5.78586 0.284188 6.01518C0.468181 6.2445 0.725032 6.40489 1.0127 6.47007H3.96838V9.40876C4.03394 9.69478 4.19525 9.9502 4.42589 10.1331C4.65654 10.3161 4.94281 10.4157 5.23785 10.4157C5.53289 10.4157 5.81924 10.3161 6.04988 10.1331C6.28053 9.9502 6.44184 9.69478 6.5074 9.40876Z" fill="#3399FF"/>
            </svg>
          </div>
          {isEditingStand ? (
            <input
              ref={standInputRef}
              type="text"
              value={stand}
              onChange={(e) => setStand(e.target.value)}
              onBlur={handleStandBlur}
              onKeyDown={handleStandKeyDown}
              className="no-print"
              style={{ 
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 600,
                fontSize: '12px',
                color: '#003366',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                lineHeight: '1',
                border: '1.5px solid #3399FF',
                borderRadius: '4px',
                padding: '2px 4px',
                background: 'white',
                outline: 'none',
                width: '120px',
                minHeight: '12px' // fontSize 12px * lineHeight 1 = 12px
              }}
            />
          ) : (
            <span 
              onClick={() => setIsEditingStand(true)}
              className="cursor-text sop-header-editable print:cursor-default print:pointer-events-none"
              style={{ 
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 600,
                fontSize: '12px',
                color: '#003366',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                lineHeight: '1',
                border: '1.5px solid transparent',
                borderRadius: '4px',
                padding: '2px 4px',
                minHeight: '12px', // fontSize 12px * lineHeight 1 = 12px
                display: 'inline-block'
              }}
            >
              {stand || '\u00A0'} {/* Non-breaking space if empty */}
            </span>
          )}
        </div>
        
        {/* Title */}
        {isEditingTitle ? (
          <textarea
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="no-print"
            rows={1}
            style={{ 
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 600,
              fontSize: '32px',
              color: '#003366',
              letterSpacing: '1.04px',
              textTransform: 'uppercase',
              lineHeight: '1.2',
              width: '100%',
              border: '1.5px solid #3399FF',
              borderRadius: '6px',
              padding: '4px 8px',
              background: 'white',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              minHeight: '38.4px' // fontSize 32px * lineHeight 1.2 = 38.4px
            }}
            onInput={(e) => {
              // Auto-resize textarea, but respect minHeight
              e.target.style.height = 'auto';
              const newHeight = Math.max(e.target.scrollHeight, 38.4); // Ensure minHeight
              e.target.style.height = newHeight + 'px';
            }}
          />
        ) : (
          <div 
            onClick={() => setIsEditingTitle(true)}
            className="no-print cursor-text sop-header-title-editable"
            style={{ 
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 600,
              fontSize: '32px',
              color: '#003366',
              letterSpacing: '1.04px',
              textTransform: 'uppercase',
              lineHeight: '1.2',
              width: '100%',
              border: '1.5px solid transparent',
              borderRadius: '6px',
              padding: '4px 8px',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              hyphens: 'auto',
              whiteSpace: 'pre-wrap', // Preserve manual line breaks
              minHeight: '38.4px' // fontSize 32px * lineHeight 1.2 = 38.4px
            }}
          >
            {title || '\u00A0'} {/* Non-breaking space if empty */}
          </div>
        )}
        {/* Static version for print */}
        <div 
          className="hidden print:block"
          style={{ 
            fontFamily: "'Roboto', sans-serif",
            fontWeight: 600,
            fontSize: '32px',
            color: '#003366',
            letterSpacing: '1.04px',
            textTransform: 'uppercase',
            lineHeight: '1.2',
            width: '100%',
            padding: '4px 8px',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            hyphens: 'auto',
            whiteSpace: 'pre-wrap', // Preserve manual line breaks
            minHeight: '38.4px' // fontSize 32px * lineHeight 1.2 = 38.4px
          }}
        >
          {title || '\u00A0'} {/* Non-breaking space if empty */}
        </div>
      </div>

      {/* Right side: Logo */}
      <div className="flex items-center justify-end" style={{ 
        paddingLeft: '14px',
        flexShrink: 0
      }}>
        <div className="relative" style={{ width: '140px', height: '84px' }}>
          {/* Logo Upload Input (hidden) */}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
            id="logo-upload"
          />
          
          {/* Logo Display */}
          <div 
            onClick={() => !companyLogo && !logo && logoInputRef.current?.click()}
            className="no-print sop-header-logo-editable group/logo"
            style={{ 
              width: '100%', 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              border: '1.5px solid transparent',
              cursor: companyLogo || logo ? 'default' : 'pointer'
            }}
            title={companyLogo ? 'Firmenlogo (im Profil festgelegt)' : logo ? 'Individuelles Logo' : 'Klicken Sie, um das Logo zu ändern'}
          >
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt="Firmenlogo" 
                style={{ 
                  maxWidth: '100%', 
                  height: '70px', 
                  width: 'auto',
                  objectFit: 'contain',
                  objectPosition: 'right center'
                }} 
              />
            ) : logo ? (
              <div className="relative">
                <img 
                  src={logo} 
                  alt="Logo" 
                  style={{ 
                    maxWidth: '100%', 
                    height: '70px', 
                    width: 'auto',
                    objectFit: 'contain',
                    objectPosition: 'right center'
                  }} 
                />
                {/* Delete button - appears on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onLogoChange) {
                      onLogoChange(null);
                    }
                  }}
                  className="absolute -top-4 -right-5 bg-destructive text-destructive-foreground p-1.5 rounded-full hover:bg-destructive/90 transition-all shadow-md opacity-0 group-hover/logo:opacity-100"
                  title="Logo entfernen"
                >
                  <Trash size={12} weight="bold" />
                </button>
              </div>
            ) : (
              <div 
                className="flex items-center justify-center rounded-lg bg-muted border-2 border-border text-muted-foreground"
                style={{ 
                  width: '100%', 
                  height: '100%'
                }}
              >
                <Image size={40} weight="duotone" />
              </div>
            )}
          </div>
          
          {/* Static logo for print */}
          <div className="hidden print:block" style={{ width: '100%', height: '100%' }}>
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt="Firmenlogo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  objectPosition: 'right center'
                }} 
              />
            ) : logo ? (
              <img 
                src={logo} 
                alt="Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  objectPosition: 'right center'
                }} 
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOPHeader;
