import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trash } from '@phosphor-icons/react';

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
                lineHeight: '12px',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 4px',
                background: 'transparent',
                outline: 'none',
                width: '120px',
                height: '16px', // 12px content + 4px padding
                boxSizing: 'border-box'
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
                lineHeight: '12px',
                borderRadius: '4px',
                padding: '2px 4px',
                height: '16px', // 12px content + 4px padding
                display: 'inline-block',
                boxSizing: 'border-box'
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
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              background: 'transparent',
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
              /* Placeholder Logo - nur im Editor sichtbar, nicht beim Drucken */
              /* Farben angepasst an muted-foreground Grautöne */
              <div 
                className="flex items-center justify-end"
                style={{ 
                  width: '100%', 
                  height: '100%'
                }}
              >
                <svg width="108" height="57" viewBox="0 0 108 57" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M43.1842 5.62477C42.0978 4.04751 40.5723 2.82187 38.7959 2.09898C38.4568 1.95964 38.0884 1.906 37.7235 1.94284C37.3586 1.97968 37.0085 2.10584 36.7043 2.31014C36.3962 2.51543 36.1437 2.79336 35.9691 3.11929C35.7946 3.44522 35.7033 3.80909 35.7034 4.17862C35.7013 4.64031 35.8435 5.09118 36.1103 5.46851C36.377 5.84583 36.7551 6.13084 37.1919 6.28385C38.2066 6.61865 39.0822 7.27789 39.683 8.15944C40.2839 9.04098 40.5764 10.0956 40.5153 11.1598V21.014C40.5421 21.7133 40.4231 22.4104 40.1657 23.0614C39.9084 23.7123 39.5184 24.3029 39.0204 24.7958C38.4263 25.3152 37.7329 25.7094 36.9821 25.9546C36.2312 26.1999 35.4384 26.291 34.6512 26.2227C33.3138 26.1127 32.0658 25.5084 31.1519 24.5282C30.238 23.5481 29.7241 22.2628 29.7111 20.9244V14.8711C29.709 14.566 29.6435 14.2645 29.5187 13.9859C29.3939 13.7072 29.2126 13.4574 28.9861 13.2522C28.7585 13.0468 28.49 12.8916 28.1981 12.7968C27.9062 12.7019 27.5976 12.6696 27.2923 12.7019C26.7404 12.7799 26.2361 13.0565 25.8745 13.4797C25.5129 13.9028 25.3189 14.4432 25.3291 14.9991V21.0268C25.3291 23.6149 26.3599 26.0969 28.1948 27.927C30.0297 29.757 32.5183 30.7851 35.1132 30.7851C37.7081 30.7851 40.1967 29.757 42.0315 27.927C43.8664 26.0969 44.8972 23.6149 44.8972 21.0268V11.115C44.8965 9.15419 44.2991 7.23978 43.1842 5.62477Z" fill="#94a3b8"/>
                  <path d="M32.9716 4.03796H30.2641V1.33763C30.2398 0.974868 30.0781 0.63489 29.8119 0.386533C29.5457 0.138177 29.1947 0 28.8302 0C28.4657 0 28.1148 0.138177 27.8485 0.386533C27.5823 0.63489 27.4206 0.974868 27.3963 1.33763V4.03796H24.6888C24.3251 4.06224 23.9842 4.22346 23.7352 4.48899C23.4862 4.75453 23.3477 5.10452 23.3477 5.4681C23.3477 5.83167 23.4862 6.18167 23.7352 6.4472C23.9842 6.71273 24.3251 6.87397 24.6888 6.89825H27.3963V9.59217C27.4206 9.95494 27.5823 10.2949 27.8485 10.5433C28.1148 10.7916 28.4657 10.9298 28.8302 10.9298C29.1947 10.9298 29.5457 10.7916 29.8119 10.5433C30.0781 10.2949 30.2398 9.95494 30.2641 9.59217V6.89825H32.9716C33.3353 6.87397 33.6762 6.71273 33.9252 6.4472C34.1742 6.18167 34.3127 5.83167 34.3127 5.4681C34.3127 5.10452 34.1742 4.75453 33.9252 4.48899C33.6762 4.22346 33.3353 4.06224 32.9716 4.03796Z" fill="#cbd5e1"/>
                  <path d="M18.736 25.8224C19.4426 25.8224 20.027 26.0534 20.489 26.5154C20.9782 26.9503 21.2228 27.521 21.2228 28.2276C21.2228 28.9071 20.9782 29.4778 20.489 29.9398C20.027 30.3747 19.4426 30.5921 18.736 30.5921H5.48678C4.78015 30.5921 4.18224 30.3611 3.69304 29.8991C3.23101 29.4099 3 28.812 3 28.1053V4.54208C3 3.83545 3.2446 3.25113 3.7338 2.7891C4.22301 2.2999 4.8481 2.0553 5.60908 2.0553C6.26135 2.0553 6.83209 2.2999 7.32129 2.7891C7.83767 3.25113 8.09586 3.83545 8.09586 4.54208V26.5154L7.19899 25.8224H18.736Z" fill="#94a3b8"/>
                  <path d="M64.0269 31C61.9614 31 60.0317 30.6195 58.238 29.8585C56.4442 29.0975 54.8679 28.0512 53.509 26.7195C52.1501 25.3606 51.0766 23.7978 50.2884 22.0313C49.5275 20.2647 49.147 18.3622 49.147 16.3239C49.147 14.2856 49.5275 12.3831 50.2884 10.6165C51.0766 8.84998 52.1501 7.30083 53.509 5.96912C54.8679 4.61022 56.4442 3.55028 58.238 2.7893C60.0317 2.02832 61.9614 1.64783 64.0269 1.64783C65.3042 1.64783 66.5408 1.78372 67.7367 2.0555C68.9325 2.32727 70.0332 2.73494 71.0388 3.2785C71.4465 3.49592 71.7454 3.79488 71.9357 4.17537C72.1531 4.52869 72.2618 4.89559 72.2618 5.27608C72.2618 5.92835 72.0444 6.51268 71.6095 7.02906C71.1747 7.54544 70.6175 7.80363 69.9381 7.80363C69.7207 7.80363 69.4896 7.77645 69.245 7.72209C69.0276 7.66774 68.8102 7.5862 68.5928 7.47749C67.9133 7.17853 67.1931 6.94752 66.4321 6.78445C65.6711 6.62139 64.8694 6.53985 64.0269 6.53985C62.2603 6.53985 60.6432 6.98829 59.1756 7.88516C57.7352 8.75485 56.5801 9.93709 55.7104 11.4319C54.8679 12.8995 54.4467 14.5302 54.4467 16.3239C54.4467 18.0905 54.8679 19.7211 55.7104 21.2159C56.5801 22.7107 57.7352 23.9065 59.1756 24.8034C60.6432 25.6731 62.2603 26.108 64.0269 26.108C64.8422 26.108 65.7391 26.0264 66.7175 25.8633C67.6959 25.7003 68.4977 25.4829 69.1227 25.2111L68.7558 26.4341V19.463L69.4489 20.0745H64.9238C64.2171 20.0745 63.6192 19.8434 63.13 19.3814C62.668 18.9194 62.437 18.3351 62.437 17.6284C62.437 16.9218 62.668 16.3375 63.13 15.8755C63.6192 15.4134 64.2171 15.1824 64.9238 15.1824H71.6095C72.3161 15.1824 72.9005 15.427 73.3625 15.9162C73.8245 16.3783 74.0555 16.9626 74.0555 17.6692V26.3118C74.0555 26.8553 73.9196 27.3038 73.6479 27.6571C73.4033 28.0104 73.1179 28.2958 72.7918 28.5132C71.5416 29.2742 70.1691 29.8857 68.6743 30.3477C67.2067 30.7826 65.6576 31 64.0269 31Z" fill="#94a3b8"/>
                  <path d="M105.986 16.3239C105.986 18.3622 105.646 20.2647 104.967 22.0313C104.288 23.7978 103.323 25.3606 102.073 26.7195C100.849 28.0512 99.3819 29.0975 97.6697 29.8585C95.9847 30.6195 94.1366 31 92.1254 31C90.1142 31 88.2661 30.6195 86.5811 29.8585C84.8961 29.0975 83.4285 28.0512 82.1783 26.7195C80.9553 25.3606 80.004 23.7978 79.3246 22.0313C78.6451 20.2647 78.3054 18.3622 78.3054 16.3239C78.3054 14.2856 78.6451 12.3831 79.3246 10.6165C80.004 8.84998 80.9553 7.30083 82.1783 5.96912C83.4285 4.61022 84.8961 3.55028 86.5811 2.7893C88.2661 2.02832 90.1142 1.64783 92.1254 1.64783C94.1366 1.64783 95.9847 2.02832 97.6697 2.7893C99.3819 3.55028 100.849 4.61022 102.073 5.96912C103.323 7.30083 104.288 8.84998 104.967 10.6165C105.646 12.3831 105.986 14.2856 105.986 16.3239ZM100.686 16.3239C100.686 14.503 100.32 12.8587 99.5857 11.3911C98.8519 9.89632 97.8463 8.71409 96.569 7.84439C95.2916 6.9747 93.8104 6.53985 92.1254 6.53985C90.4404 6.53985 88.9592 6.9747 87.6818 7.84439C86.4044 8.71409 85.3989 9.88274 84.6651 11.3503C83.9584 12.818 83.6051 14.4758 83.6051 16.3239C83.6051 18.1448 83.9584 19.8027 84.6651 21.2975C85.3989 22.7651 86.4044 23.9337 87.6818 24.8034C88.9592 25.6731 90.4404 26.108 92.1254 26.108C93.8104 26.108 95.2916 25.6731 96.569 24.8034C97.8463 23.9337 98.8519 22.7651 99.5857 21.2975C100.32 19.8027 100.686 18.1448 100.686 16.3239Z" fill="#94a3b8"/>
                  <path d="M106 40C107.105 40 108 40.8954 108 42V55C108 56.1046 107.105 57 106 57H2C0.895431 57 4.02666e-09 56.1046 0 55V42C0 40.8954 0.895431 40 2 40H106ZM7.48828 44L6 52.9678H7.62402L8.12793 49.9375H9.83984C10.5317 49.9375 11.1366 49.8106 11.6533 49.5566C12.1698 49.2998 12.5852 48.9475 12.9004 48.501C13.2186 48.0544 13.4251 47.5438 13.5186 46.9688C13.6149 46.3966 13.5795 45.887 13.4131 45.4404C13.2467 44.9911 12.9504 44.6397 12.5244 44.3857C12.0982 44.1289 11.5405 44 10.8516 44H7.48828ZM16.3984 44L14.9092 52.9678H20.4834L20.7109 51.6055H16.7617L18.0225 44H16.3984ZM27.2803 44L22.6348 52.9678H24.3691L25.4805 50.7559H28.8506L29.2246 52.9678H30.959L29.2861 44H27.2803ZM33.1367 44L32.9092 45.3613H35.6807L34.4199 52.9678H36.0312L37.292 45.3613H40.0645L40.292 44H33.1367ZM42.4648 44L42.2373 45.3613H46.8652L41.1777 51.9561L41.002 52.9678H47.6406L47.8682 51.6055H43.2402L48.9404 45.0117L49.1025 44H42.4648ZM51.6875 44L50.1992 52.9678H51.8232L52.4541 49.1582H56.6094L55.9785 52.9678H57.6074L59.0957 44H57.4678L56.8369 47.7959H52.6816L53.3115 44H51.6875ZM64.4238 44L59.7783 52.9678H61.5117L62.623 50.7559H65.9941L66.3682 52.9678H68.1025L66.4297 44H64.4238ZM71.7588 44L70.2695 52.9678H75.8438L76.0713 51.6055H72.1221L73.3828 44H71.7588ZM78.1904 44L77.9629 45.3613H80.7344L79.4736 52.9678H81.085L82.3457 45.3613H85.1182L85.3457 44H78.1904ZM87.7109 44L86.2227 52.9678H92.0898L92.3174 51.6055H88.0742L88.4775 49.1582H92.3828L92.6113 47.7959H88.7051L89.1084 45.3613H93.3154L93.5439 44H87.7109ZM96.1875 44L94.6982 52.9678H96.3232L96.8691 49.6836H98.5215L99.7383 52.9678H101.551L100.199 49.4131C100.261 49.3893 100.322 49.3648 100.382 49.3379C100.896 49.1073 101.309 48.7816 101.621 48.3613C101.936 47.9381 102.141 47.4403 102.234 46.8682C102.331 46.2961 102.294 45.7953 102.125 45.3662C101.956 44.9344 101.656 44.5987 101.228 44.3594C100.798 44.12 100.239 44 99.5498 44H96.1875ZM28.0205 45.8389L28.6309 49.4512H26.1357L27.9502 45.8389H28.0205ZM65.1641 45.8389L65.7744 49.4512H63.2783L65.0938 45.8389H65.1641ZM10.3789 45.3574C10.7845 45.3575 11.1044 45.4263 11.3379 45.5635C11.5741 45.6977 11.7327 45.8859 11.8145 46.1279C11.8962 46.3702 11.9129 46.6506 11.8633 46.9688C11.8108 47.2868 11.7024 47.5683 11.5391 47.8135C11.3756 48.0586 11.1522 48.2515 10.8691 48.3916C10.589 48.5317 10.2474 48.6015 9.84473 48.6016H8.35059L8.88965 45.3574H10.3789ZM99.0771 45.3574C99.48 45.3574 99.7997 45.4174 100.036 45.5371C100.275 45.6539 100.438 45.8261 100.522 46.0537C100.61 46.2784 100.629 46.5501 100.579 46.8682C100.527 47.1862 100.42 47.4549 100.26 47.6738C100.102 47.8898 99.8857 48.0551 99.6113 48.1689C99.337 48.2798 98.9984 48.3349 98.5957 48.335H97.0938L97.5889 45.3574H99.0771Z" fill="#cbd5e1"/>
                </svg>
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
