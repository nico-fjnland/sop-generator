import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trash } from '@phosphor-icons/react';
import { EDITOR_STYLES } from '../styles/editorStyles';

const SOPHeader = ({ title: initialTitle = 'SOP Überschrift', stand: initialStand = 'STAND 12/22', logo: initialLogo = null, onTitleChange, onStandChange, onLogoChange }) => {
  const { organization, organizationId } = useAuth();
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
      alignItems: 'flex-start',
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
              fontFamily: EDITOR_STYLES.sopHeader.standFontFamily,
              fontWeight: EDITOR_STYLES.sopHeader.standFontWeight,
              fontSize: EDITOR_STYLES.sopHeader.standFontSize,
              color: EDITOR_STYLES.text.color,
              letterSpacing: EDITOR_STYLES.sopHeader.standLetterSpacing,
              textTransform: 'uppercase',
              lineHeight: EDITOR_STYLES.sopHeader.standLineHeight,
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
              fontFamily: EDITOR_STYLES.sopHeader.standFontFamily,
              fontWeight: EDITOR_STYLES.sopHeader.standFontWeight,
              fontSize: EDITOR_STYLES.sopHeader.standFontSize,
              color: EDITOR_STYLES.text.color,
              letterSpacing: EDITOR_STYLES.sopHeader.standLetterSpacing,
              textTransform: 'uppercase',
              lineHeight: EDITOR_STYLES.sopHeader.standLineHeight,
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
              fontFamily: EDITOR_STYLES.sopHeader.titleFontFamily,
              fontWeight: EDITOR_STYLES.sopHeader.titleFontWeight,
              fontSize: EDITOR_STYLES.sopHeader.titleFontSize,
              color: EDITOR_STYLES.text.color,
              letterSpacing: EDITOR_STYLES.sopHeader.titleLetterSpacing,
              textTransform: 'uppercase',
              lineHeight: EDITOR_STYLES.sopHeader.titleLineHeight,
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
              fontFamily: EDITOR_STYLES.sopHeader.titleFontFamily,
              fontWeight: EDITOR_STYLES.sopHeader.titleFontWeight,
              fontSize: EDITOR_STYLES.sopHeader.titleFontSize,
              color: EDITOR_STYLES.text.color,
              letterSpacing: EDITOR_STYLES.sopHeader.titleLetterSpacing,
              textTransform: 'uppercase',
              lineHeight: EDITOR_STYLES.sopHeader.titleLineHeight,
              width: '100%',
              borderRadius: '6px',
              padding: '4px 8px',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              hyphens: 'none',
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
            fontFamily: EDITOR_STYLES.sopHeader.titleFontFamily,
            fontWeight: EDITOR_STYLES.sopHeader.titleFontWeight,
            fontSize: EDITOR_STYLES.sopHeader.titleFontSize,
            color: EDITOR_STYLES.text.color,
            letterSpacing: EDITOR_STYLES.sopHeader.titleLetterSpacing,
            textTransform: 'uppercase',
            lineHeight: EDITOR_STYLES.sopHeader.titleLineHeight,
            width: '100%',
            padding: '4px 8px',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            hyphens: 'none',
            whiteSpace: 'pre-wrap', // Preserve manual line breaks
            minHeight: '38.4px' // fontSize 32px * lineHeight 1.2 = 38.4px
          }}
        >
          {title || '\u00A0'} {/* Non-breaking space if empty */}
        </div>
      </div>

      {/* Right side: Logo */}
      <div className="flex items-start justify-end" style={{ 
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
              alignItems: 'flex-start',
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
                  objectPosition: 'right top'
                }} 
              />
            ) : logo ? (
              <div className="relative">
                <img 
                  src={logo} 
                  alt="Logo" 
                  style={{ 
                    maxWidth: '100%', 
                    height: EDITOR_STYLES.sopHeader.logoHeight, 
                    width: 'auto',
                    objectFit: 'contain',
                    objectPosition: 'right top'
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
                className="flex items-start justify-end"
                style={{ 
                  width: '100%', 
                  height: '100%'
                }}
              >
                <svg width="103" height="61" viewBox="0 0 103 61" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.335 48.0049C11.6237 48.0246 11.8407 48.1162 11.9785 48.2803C12.1229 48.4509 12.2145 48.6546 12.2539 48.8975C12.2999 49.1404 12.3063 49.3837 12.2734 49.6201C12.234 49.9353 12.1486 50.2114 12.0107 50.4609C11.8729 50.7036 11.6893 50.9005 11.4531 51.0449C11.2233 51.1894 10.9408 51.2685 10.6191 51.2686L9.20801 51.2578L9.77832 47.9912L11.335 48.0049Z" fill="#C9D6E3"/>
                  <path d="M27.9238 52.5488H25.8779L27.5469 48.7979L27.9238 52.5488Z" fill="#C9D6E3"/>
                  <path d="M62.334 52.5488H60.2959L61.959 48.8105L62.334 52.5488Z" fill="#C9D6E3"/>
                  <path d="M93.3887 47.998C93.6842 48.0112 93.9012 48.0902 94.0391 48.2412C94.1834 48.3922 94.2758 48.5827 94.3086 48.8125C94.3414 49.0357 94.3414 49.2721 94.3086 49.5215C94.2758 49.8236 94.1838 50.0998 94.0459 50.3428C93.9014 50.5857 93.7168 50.782 93.4805 50.9199C93.2506 51.0578 92.9751 51.1367 92.6533 51.1367L91.5479 51.127L92.0947 47.998H93.3887Z" fill="#C9D6E3"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M99.8115 43.1318C101.248 43.1319 102.412 44.2962 102.412 45.7324V57.5596C102.412 58.9957 101.248 60.1601 99.8115 60.1602H2.60059C1.16439 60.1602 4.69009e-05 58.9958 0 57.5596V45.7324C0 44.2962 1.16436 43.1318 2.60059 43.1318H99.8115ZM6.8623 56.0098H8.37988L8.98145 52.5625H10.5469V52.5557C11.1508 52.5556 11.6826 52.4374 12.1553 52.2012C12.628 51.9582 13.0028 51.6166 13.2852 51.1768C13.5741 50.7303 13.7385 50.2046 13.791 49.6006C13.837 49.0687 13.7772 48.5887 13.6064 48.1553C13.4357 47.7221 13.1603 47.3739 12.7861 47.1113C12.4118 46.8486 11.9517 46.7108 11.3936 46.6846H8.48438L6.8623 56.0098ZM15.6035 56.0098H20.4824L20.7119 54.709H17.3467L18.7422 46.6846H17.2246L15.6035 56.0098ZM22.709 56.0098H24.3369L25.2959 53.8555H28.0547L28.2705 56.0098H29.8076L28.5537 46.6846H27.1943L22.709 56.0098ZM32.5137 47.9912H34.8076L33.4131 56.0098H34.917L36.3115 47.9912H38.6201L38.8506 46.6846H32.7432L32.5137 47.9912ZM41.0439 47.9912H44.8955L39.8486 54.8994L39.6514 56.0098H45.3848L45.6143 54.709H41.6592L46.7041 47.7617L46.8877 46.6846H41.2734L41.0439 47.9912ZM48.248 56.0098H49.7646L50.4844 51.8721H53.6104L52.8906 56.0098H54.4004L56.0225 46.6846H54.5127L53.8379 50.5654H50.7119L51.3867 46.6846H49.8691L48.248 56.0098ZM57.126 56.0098H58.7549L59.7139 53.8555H62.4658L62.6816 56.0098H64.2188L62.9639 46.6846H61.6113L57.126 56.0098ZM66.8457 56.0098H71.7314L71.9609 54.709H68.5889L69.9844 46.6846H68.4668L66.8457 56.0098ZM73.8457 47.9912H76.1396L74.7451 56.0098H76.249L77.6436 47.9912H79.9531L80.1826 46.6846H74.0752L73.8457 47.9912ZM81.3057 56.0098H86.3555L86.5859 54.709H83.0488L83.5469 51.8467H86.5527L86.7764 50.5654H83.7695L84.2168 47.9912H87.7148L87.9385 46.6846H82.9277L81.3057 56.0098ZM90.8018 46.6846L89.1797 56.0098H90.6963L91.3213 52.4307H92.5703L93.4287 56.0098H95.0508V55.918L94.0088 52.0732C94.3139 51.9233 94.5862 51.7485 94.8203 51.5508C95.1158 51.2947 95.3459 50.9926 95.5166 50.6445C95.6873 50.2965 95.7926 49.8955 95.832 49.4424C95.8779 48.8975 95.8189 48.4178 95.6416 48.0107C95.4709 47.6103 95.2014 47.2887 94.8271 47.0654C94.4594 46.829 93.9996 46.7108 93.4414 46.6846H90.8018Z" fill="#C9D6E3"/>
                  <path d="M44.7079 5.85773C43.5916 4.22913 42.0352 2.97484 40.2161 2.23277C39.5135 1.94382 38.7057 2.02919 38.0753 2.45605C37.4383 2.8829 37.0509 3.5987 37.0509 4.3736C37.0509 5.35208 37.6616 6.22548 38.5744 6.53413C40.7415 7.28277 41.9827 9.10182 41.9827 11.5382V21.6513C41.9827 23.2339 41.4507 24.5802 40.4525 25.5324C39.3756 26.5634 37.7798 27.0756 35.9739 26.9968C33.2354 26.8655 30.9173 24.3766 30.9173 21.5594V15.347C30.9173 14.7166 30.6481 14.1124 30.1752 13.6856C29.709 13.2587 29.0589 13.042 28.4416 13.1208C27.3186 13.2324 26.4321 14.27 26.4321 15.4783V21.6644C26.4321 27.1938 30.9304 31.6922 36.4598 31.6922C41.9892 31.6922 46.4548 27.207 46.4548 21.6973V11.4988C46.4548 9.4827 45.8506 7.53231 44.7014 5.8643L44.7079 5.85773Z" fill="#C9D6E3"/>
                  <path d="M92.673 11.4922C92.4301 6.17952 88.0433 1.92412 82.6715 1.92412C77.2998 1.92412 72.6766 6.40936 72.6766 11.919V21.6579L72.7029 22.1175C72.9459 27.4302 77.3326 31.6856 82.7044 31.6856C88.0762 31.6856 92.6993 27.2004 92.6993 21.6907V11.9519L92.673 11.4922ZM88.2206 21.6447C88.2206 23.2274 87.6887 24.5736 86.6905 25.5258C85.6135 26.5568 84.0178 27.069 82.2119 26.9902C79.4734 26.8589 77.1553 24.37 77.1553 21.5528V11.965C77.1553 10.3824 77.6872 9.03615 78.6854 8.08394C79.7624 7.05292 81.3581 6.5407 83.1641 6.6195C85.9025 6.75084 88.2206 9.23973 88.2206 12.057V21.6447Z" fill="#C9D6E3"/>
                  <path d="M34.2534 4.22256H31.4821V1.4513C31.4821 0.636996 30.832 0 30.0045 0C29.1771 0 28.5532 0.65013 28.5532 1.4513V4.22256H25.782C24.9677 4.22256 24.3307 4.87269 24.3307 5.70013C24.3307 6.52757 24.9808 7.15143 25.782 7.15143H28.5532V9.92269C28.5532 10.737 29.2034 11.374 30.0308 11.374C30.8582 11.374 31.4821 10.7239 31.4821 9.92269V7.15143H34.2534C35.0677 7.15143 35.7047 6.5013 35.7047 5.67386C35.7047 4.84642 35.0545 4.22256 34.2534 4.22256Z" fill="#C9D6E3"/>
                  <path d="M22.4 26.7079C23.1355 26.7079 23.7528 26.9443 24.2519 27.4105C24.7444 27.8768 24.9939 28.4809 24.9939 29.2164C24.9939 29.9519 24.7444 30.5167 24.2519 30.983C23.7528 31.4492 23.142 31.6856 22.4 31.6856H12.3065C11.571 31.6856 10.9537 31.4361 10.4547 30.9436C9.95557 30.451 9.71259 29.8337 9.71259 29.0917V4.51807C9.71259 3.78257 9.9687 3.16528 10.4809 2.66619C10.9931 2.1671 11.6433 1.92412 12.4379 1.92412C13.1208 1.92412 13.7184 2.17367 14.2438 2.66619C14.7692 3.16528 15.0318 3.77601 15.0318 4.51807V27.4368L14.0993 26.7144H22.4065L22.4 26.7079Z" fill="#C9D6E3"/>
                  <path d="M59.5099 1.92412C57.8222 1.92412 56.2593 2.2262 54.8605 2.83036C53.4683 3.42796 52.3519 4.40644 51.5245 5.7461C50.7036 7.08576 50.2833 8.89168 50.2833 11.1113V22.505C50.2833 24.7246 50.7036 26.5306 51.5245 27.8702C52.3454 29.2099 53.4749 30.1884 54.8802 30.7859C56.2987 31.3835 57.9076 31.6922 59.6741 31.6922C61.4406 31.6922 63.0561 31.3901 64.4877 30.7859C65.9062 30.1884 67.0422 29.2099 67.8631 27.8702C68.684 26.5306 69.1043 24.7246 69.1043 22.505V17.6454C69.1043 17.2186 68.9795 16.864 68.7168 16.5488C68.4607 16.2467 68.093 16.0956 67.6004 16.0956H60.8562C59.7989 16.0956 58.9386 16.9559 58.9386 18.0132C58.9386 19.0705 59.7989 19.9307 60.8562 19.9307H64.1265V22.505C64.1265 24.1205 63.7259 25.3485 62.9379 26.1562C62.1433 26.964 61.0466 27.3711 59.6741 27.3711C58.3016 27.3711 57.2049 26.964 56.4103 26.1562C55.6223 25.3551 55.2217 24.127 55.2217 22.505V11.1113C55.2217 9.49584 55.6223 8.26781 56.4103 7.46008C57.1655 6.69174 58.2294 6.29772 59.6675 6.24519C59.7398 6.24519 59.812 6.24519 59.8843 6.24519C62.8788 6.24519 63.3976 8.40572 63.4041 8.43199C64.0083 10.0475 64.514 10.8224 65.7617 10.8224C67.0094 10.8224 67.8828 9.87015 67.8828 8.51079C67.6727 5.24701 65.4662 2.79753 62.1302 2.1277C61.4735 1.99636 60.7839 1.92412 60.0944 1.92412H59.5099Z" fill="#C9D6E3"/>
                  </svg>

              </div>
            )}
          </div>
          
          {/* Static logo for print */}
          <div className="hidden print:flex sop-header-logo-print" style={{ 
            width: '100%', 
            height: '100%',
            justifyContent: 'flex-end',
            alignItems: 'flex-start'
          }}>
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt="Firmenlogo" 
                style={{ 
                  maxWidth: '100%', 
                  height: '70px', 
                  width: 'auto',
                  objectFit: 'contain',
                  objectPosition: 'right top'
                }} 
              />
            ) : logo ? (
              <img 
                src={logo} 
                alt="Logo" 
                style={{ 
                  maxWidth: '100%', 
                  height: '70px', 
                  width: 'auto',
                  objectFit: 'contain',
                  objectPosition: 'right top'
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
