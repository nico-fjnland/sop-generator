import React, { useState } from 'react';
import { FOOTER } from '../constants/layout';
import { useAuth } from '../contexts/AuthContext';

const FOOTER_VARIANTS = [
  { id: 'tiny', label: 'Tiny' },
  { id: 'small', label: 'Small' },
  { id: 'signature', label: 'Signature' },
  { id: 'placeholder', label: 'Placeholder' },
];

/* ============================================
   SVG ICONS - HIER SVG CODE EINFÜGEN
   ============================================ */
const VectorIcon = () => (
  <svg width="90%" height="90%" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1.52039 4.96499C1.49095 4.9625 1.46134 4.9625 1.4319 4.96499C1.22855 4.99347 1.04279 5.09575 0.909967 5.25234C0.777144 5.40893 0.706541 5.60891 0.711626 5.81418V8.21007C0.711626 9.22153 1.11344 10.1916 1.82865 10.9068C2.54386 11.622 3.5139 12.0238 4.52536 12.0238C5.53682 12.0238 6.50684 11.622 7.22205 10.9068C7.93726 10.1916 8.33907 9.22153 8.33907 8.21007V4.27757C8.33913 3.51049 8.10648 2.76143 7.67186 2.12936C7.24811 1.51255 6.65342 1.03294 5.96086 0.749438C5.85807 0.704239 5.74717 0.680406 5.63489 0.67936C5.52261 0.678314 5.41129 0.700084 5.30768 0.74336C5.20407 0.786636 5.11033 0.850506 5.03215 0.931104C4.95397 1.0117 4.89298 1.10734 4.85288 1.21222C4.81278 1.3171 4.79442 1.42903 4.79889 1.54123C4.80335 1.65342 4.83055 1.76355 4.87885 1.86492C4.92716 1.96628 4.99557 2.05677 5.07991 2.1309C5.16425 2.20503 5.26276 2.26125 5.36948 2.29615C5.78428 2.43288 6.14237 2.70267 6.38821 3.06366C6.63405 3.42466 6.75391 3.85668 6.72917 4.29274V8.21007C6.73978 8.49655 6.69089 8.78211 6.58562 9.04875C6.48036 9.3154 6.32099 9.55734 6.11755 9.75931C5.87678 9.96999 5.59608 10.13 5.29213 10.2299C4.98819 10.3298 4.66724 10.3674 4.34843 10.3406C3.80146 10.2971 3.29062 10.0503 2.91642 9.64902C2.54223 9.2477 2.3318 8.72084 2.32658 8.17216V5.76869C2.32594 5.55638 2.24184 5.35283 2.09242 5.20199C1.94301 5.05116 1.74024 4.96513 1.52794 4.96248L1.52039 4.96499Z" fill="#004D99"/>
  <path d="M2.5262 3.6736V2.5262H3.67361C3.78529 2.50075 3.885 2.43813 3.95642 2.34859C4.02785 2.25906 4.06675 2.14791 4.06675 2.03337C4.06675 1.91884 4.02785 1.80769 3.95642 1.71815C3.885 1.62862 3.78529 1.56599 3.67361 1.54054H2.5262V0.39315C2.50075 0.281476 2.43813 0.18175 2.34859 0.110323C2.25906 0.0388961 2.14789 0 2.03336 0C1.91882 0 1.80769 0.0388961 1.71815 0.110323C1.62862 0.18175 1.56599 0.281476 1.54054 0.39315V1.54054H0.393134C0.281461 1.56599 0.18175 1.62862 0.110323 1.71815C0.0388961 1.80769 0 1.91884 0 2.03337C0 2.14791 0.0388961 2.25906 0.110323 2.34859C0.18175 2.43813 0.281461 2.50075 0.393134 2.5262H1.54054V3.6736C1.56599 3.78527 1.62862 3.885 1.71815 3.95642C1.80769 4.02785 1.91882 4.06675 2.03336 4.06675C2.14789 4.06675 2.25906 4.02785 2.34859 3.95642C2.43813 3.885 2.50075 3.78527 2.5262 3.6736Z" fill="#3399FF"/>
  </svg>
);

// TODO: CC0 Lizenz-Symbole (100px x 20px)
// Original: 85c2e08be9d26df40890ad4f5e2f23e3ce0b070a.svg
const CCSymbols = () => (
  <svg width="90%" height="90%" viewBox="0 0 72 14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8.87503 7.90359C8.57925 7.90359 8.35534 7.79555 8.2033 7.5797C8.05125 7.36386 7.97548 7.07591 7.97548 6.71633C7.97548 5.92482 8.27541 5.52907 8.87503 5.52907C9.00287 5.52907 9.13683 5.56916 9.27689 5.64909C9.41672 5.72902 9.53478 5.86909 9.63085 6.0688L10.5182 5.60093C10.1664 4.9534 9.57463 4.62951 8.74327 4.62951C8.17543 4.62951 7.70585 4.81749 7.33406 5.1932C6.96226 5.56915 6.77648 6.07686 6.77648 6.71633C6.77648 7.37193 6.95835 7.88379 7.32208 8.25143C7.68581 8.61908 8.17152 8.80314 8.77921 8.80314C9.14685 8.80314 9.48687 8.70928 9.79854 8.5213C10.1104 8.33357 10.3581 8.07568 10.5421 7.74764L9.70247 7.32793C9.5426 7.7117 9.26687 7.90359 8.87503 7.90359Z" fill="#004D99"/>
  <path d="M5.00102 7.90359C4.70524 7.90359 4.48133 7.79555 4.32928 7.5797C4.17724 7.36386 4.10146 7.07591 4.10146 6.71633C4.10146 5.92482 4.40139 5.52907 5.00102 5.52907C5.12104 5.52907 5.25084 5.56916 5.3909 5.64909C5.53073 5.72902 5.64879 5.86909 5.74461 6.0688L6.64417 5.60093C6.28434 4.9534 5.68864 4.62951 4.85704 4.62951C4.2892 4.62951 3.81962 4.81749 3.44782 5.1932C3.07602 5.56915 2.89 6.07686 2.89 6.71633C2.89 7.37193 3.07382 7.88379 3.44171 8.25143C3.80935 8.61908 4.29311 8.80314 4.89297 8.80314C5.26868 8.80314 5.61261 8.70928 5.92428 8.5213C6.23619 8.33357 6.4799 8.07568 6.6559 7.74764L5.82846 7.32793C5.66859 7.7117 5.39286 7.90359 5.00102 7.90359Z" fill="#004D99"/>
  <path d="M12.9408 4.13183C12.6128 3.32028 12.1332 2.59868 11.5016 1.96704C10.1823 0.655842 8.58315 0 6.70435 0C4.84121 0 3.26992 0.651931 1.99099 1.95506C1.34346 2.60259 0.849686 3.33641 0.509909 4.15579C0.169644 4.9754 0 5.82876 0 6.71633C0 7.61197 0.167933 8.46337 0.503798 9.27101C0.839664 10.0787 1.32928 10.8042 1.9729 11.4478C2.61652 12.0914 3.34399 12.5832 4.15579 12.923C4.96734 13.263 5.81678 13.4327 6.70435 13.4327C7.59193 13.4327 8.45115 13.2608 9.28299 12.9169C10.1143 12.5732 10.8579 12.0772 11.5135 11.4297C12.1449 10.8142 12.6231 10.1046 12.9467 9.30108C13.2706 8.49735 13.4324 7.63593 13.4324 6.71658C13.4327 5.8048 13.2686 4.94338 12.9408 4.13183ZM10.6502 10.5663C10.1063 11.0941 9.49663 11.4979 8.82124 11.7775C8.14535 12.0577 7.44795 12.1972 6.72831 12.1972C6.0006 12.1972 5.30491 12.0594 4.6415 11.7836C3.97783 11.5079 3.38212 11.108 2.85437 10.5842C2.32661 10.0606 1.92084 9.46486 1.63704 8.79704C1.353 8.12971 1.21122 7.43597 1.21122 6.71633C1.21122 5.98887 1.353 5.29123 1.63704 4.62341C1.92084 3.95583 2.32661 3.35425 2.85437 2.81843C3.90181 1.74704 5.19296 1.21122 6.72831 1.21122C8.24728 1.21122 9.54675 1.75095 10.6262 2.83041C11.1457 3.35034 11.5416 3.9419 11.8135 4.60556C12.0853 5.26923 12.2212 5.97273 12.2212 6.71633C12.2212 8.25951 11.6976 9.54284 10.6502 10.5663Z" fill="#004D99"/>
  <path d="M26.1608 4.25772C26.7844 4.25772 27.0963 3.94581 27.0963 3.32223C27.0963 2.69083 26.7844 2.37477 26.1608 2.37477C25.5372 2.37477 25.2253 2.69059 25.2253 3.32223C25.2253 3.94581 25.537 4.25772 26.1608 4.25772Z" fill="#004D99"/>
  <path d="M30.9222 1.94308C29.6266 0.647531 28.0356 0 26.1487 0C24.2936 0 22.7187 0.647531 21.4234 1.94308C20.1041 3.2863 19.4443 4.87738 19.4443 6.71633C19.4443 8.55553 20.1041 10.1341 21.4234 11.4536C22.7585 12.7729 24.3335 13.4329 26.1487 13.4329C27.9957 13.4329 29.5988 12.7656 30.9579 11.4297C32.2368 10.1745 32.8772 8.60344 32.8772 6.71658C32.8772 4.83754 32.2251 3.24621 30.9222 1.94308ZM30.0825 10.5663C28.971 11.6614 27.6679 12.2097 26.1726 12.2097C24.6693 12.2097 23.374 11.6658 22.2867 10.5783C21.1992 9.49126 20.6558 8.20377 20.6558 6.71658C20.6558 5.23745 21.2034 3.93823 22.2989 2.81868C23.3542 1.74728 24.6456 1.21146 26.1729 1.21146C27.6919 1.21146 28.9872 1.74728 30.0586 2.81868C31.1302 3.89008 31.666 5.18929 31.666 6.71658C31.6655 8.26757 31.1378 9.5509 30.0825 10.5663Z" fill="#004D99"/>
  <path d="M27.5402 4.61754H24.7814C24.6613 4.61754 24.5594 4.65959 24.4756 4.74343C24.3917 4.82752 24.3497 4.92945 24.3497 5.04923V7.79555H25.1172V11.0577H27.204V7.7958H27.9718V5.04923C27.9718 4.92921 27.9278 4.82727 27.8398 4.74343C27.7516 4.65959 27.6519 4.61754 27.5402 4.61754Z" fill="#004D99"/>
  <path d="M50.3663 1.94284C49.071 0.647531 47.4799 0 45.593 0C43.7379 0 42.163 0.647531 40.8677 1.94284C39.5484 3.28606 38.8887 4.87738 38.8887 6.71633C38.8887 8.54746 39.5484 10.1224 40.8677 11.4417C42.1948 12.769 43.77 13.4327 45.593 13.4327C47.44 13.4327 49.0429 12.7651 50.4022 11.4297C51.6814 10.1745 52.3213 8.60344 52.3213 6.71633C52.3213 4.82923 51.6694 3.23814 50.3663 1.94284ZM49.5269 10.5541C48.4315 11.6494 47.1284 12.1972 45.617 12.1972C44.1217 12.1972 42.8264 11.6575 41.7311 10.5781C40.6435 9.49077 40.1001 8.20328 40.1001 6.71609C40.1001 6.06049 40.2001 5.45696 40.4001 4.90501L43.8301 6.44011L44.8976 6.90798L45.6891 7.2678L46.3366 7.54377C46.4566 7.64766 46.5165 7.78357 46.5165 7.95151C46.5165 8.19131 46.4344 8.36339 46.2706 8.46728C46.1066 8.57117 45.9088 8.62324 45.6769 8.62324C45.1171 8.62324 44.6175 8.41937 44.1777 8.01164L43.2542 8.94713C43.8697 9.47488 44.5495 9.74279 45.2931 9.75061V10.7822H46.0726V9.75061C46.5361 9.71077 46.9382 9.55701 47.278 9.28886C47.6178 9.02095 47.8316 8.6753 47.9196 8.25144L50.4504 9.37881C50.2262 9.78654 49.9185 10.1784 49.5269 10.5541ZM47.4999 6.62027L46.4205 6.14067L45.8328 5.87667L44.9814 5.49289C44.9413 5.43691 44.9215 5.38094 44.9215 5.32496C44.9215 5.13307 45.0034 4.99716 45.1675 4.91723C45.3312 4.83729 45.517 4.79721 45.725 4.79721C46.1169 4.79721 46.5004 4.92921 46.8764 5.19296L47.752 4.29341C47.2482 3.90963 46.6884 3.70185 46.0729 3.66983V2.63828H45.2931V3.66983C44.8773 3.69379 44.5136 3.81185 44.2017 4.02354C43.8897 4.23547 43.6778 4.51732 43.5659 4.86907L40.9992 3.71774C41.2309 3.38188 41.4788 3.08195 41.7428 2.81819C42.7981 1.73873 44.0895 1.199 45.6167 1.199C47.1438 1.199 48.4391 1.73873 49.5024 2.81819C50.5738 3.8737 51.1096 5.17292 51.1096 6.71609C51.1096 7.204 51.0537 7.6836 50.9417 8.15537L47.4999 6.62027Z" fill="#004D99"/>
  <path d="M67.5955 7.29428H62.7127V8.44597H67.5955V7.29428Z" fill="#004D99"/>
  <path d="M67.5955 5.13465H62.7127V6.28634H67.5955V5.13465Z" fill="#004D99"/>
  <path d="M69.815 1.95567C68.5112 0.65189 66.9197 0 65.0403 0C63.1927 0 61.6171 0.65189 60.3136 1.95567C58.9939 3.29931 58.334 4.88697 58.334 6.71843C58.334 8.55819 58.9939 10.1375 60.3136 11.4572C61.6491 12.7769 63.2245 13.4366 65.0403 13.4366C66.8957 13.4366 68.4992 12.773 69.8509 11.445C71.1305 10.1732 71.7706 8.59781 71.7706 6.71818C71.7706 4.83905 71.1185 3.25114 69.815 1.95567ZM68.9753 10.5694C67.8635 11.6653 66.56 12.213 65.0643 12.213C63.5605 12.213 62.2648 11.6692 61.1772 10.5816C60.0894 9.50179 59.5458 8.21415 59.5458 6.71843C59.5458 5.23884 60.0935 3.94313 61.1894 2.83154C62.245 1.75174 63.5368 1.21184 65.0645 1.21184C66.592 1.21184 67.8877 1.75174 68.9513 2.83154C70.023 3.88713 70.559 5.18284 70.559 6.71843C70.5588 8.26208 70.0309 9.54581 68.9753 10.5694Z" fill="#004D99"/>
  </svg>
);

// SealCheck Icon (Phosphor Icons - filled)
const SealCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 256 256" fill="#3399FF" xmlns="http://www.w3.org/2000/svg">
    <path d="M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-52.2,6.84-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"/>
  </svg>
);

// Signature Fields Component
const SignatureFields = () => {
  const fields = ['Erstellt:', 'Modifiziert/Geprüft:', 'Freigegeben:', 'Gültig ab:'];
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      width: '100%'
    }}>
      {fields.map((label) => (
        <div key={label} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: '10px',
            color: '#003366',
            whiteSpace: 'nowrap'
          }}>
            {label}
          </span>
          <div style={{
            borderBottom: '1px solid #003366',
            width: '100%',
            minHeight: '1px'
          }} />
        </div>
      ))}
    </div>
  );
};

// Placeholder Content Component (nur im Editor sichtbar, im Export als Weißraum)
const PlaceholderContent = () => {
  return (
    <div 
      className="placeholder-footer-content"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingTop: '8px',
        paddingBottom: '12px'
      }}
    >
      {/* Signature-ähnliche Höhe durch Grid-Struktur */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        width: '100%'
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: '10px',
              color: 'transparent',
              whiteSpace: 'nowrap'
            }}>
              &nbsp;
            </span>
            <div style={{
              borderBottom: '1px solid transparent',
              width: '100%',
              minHeight: '1px'
            }} />
          </div>
        ))}
      </div>
      {/* Zentrierter Platzhalter-Text - nur im Editor sichtbar */}
      <div 
        className="placeholder-footer-text"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: '12px',
          color: '#3399FF',
          textAlign: 'center',
          textWrap: 'balance',
          maxWidth: '80%'
        }}
      >
        Platzhalter für Dokumentenlenksysteme (Diese Box wird im Export nicht angezeigt, sondern erscheint als Weißraum).
      </div>
    </div>
  );
};

// Hospital License Badge
const HospitalLicenseBadge = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }}>
    <SealCheckIcon />
    <span style={{
      fontFamily: "'Quicksand', sans-serif",
      fontWeight: 600,
      fontSize: '10px',
      color: '#003366',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap'
    }}>
      Krankenhaus-Lizenz
    </span>
  </div>
);


const SOPFooter = ({ variant: initialVariant = 'tiny', onVariantChange }) => {
  const [variant, setVariant] = useState(initialVariant);
  const { organization } = useAuth();
  
  // Get license model from organization (default to creative_commons for backwards compatibility)
  const licenseModel = organization?.license_model || 'creative_commons';
  const isHospitalLicense = licenseModel === 'hospital_license';

  const handleFooterClick = () => {
    const currentIndex = FOOTER_VARIANTS.findIndex(v => v.id === variant);
    const nextIndex = (currentIndex + 1) % FOOTER_VARIANTS.length;
    const nextVariant = FOOTER_VARIANTS[nextIndex].id;
    setVariant(nextVariant);
    if (onVariantChange) {
      onVariantChange(nextVariant);
    }
  };

  const renderFooterContent = () => {
    const hasDisclaimer = variant === 'small';
    const hasSignature = variant === 'signature';
    const hasPlaceholder = variant === 'placeholder';

    // Placeholder hat keinen normalen Footer-Content
    if (hasPlaceholder) {
      return null;
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        alignItems: 'flex-start',
        width: '100%'
      }}>
        {/* Header: Logo + CC Symbols */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '14px',
              height: '18px',
              flexShrink: 0
            }}>
              <VectorIcon />
            </div>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontStyle: 'italic',
                fontSize: '10px',
                color: '#004D99',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                userSelect: 'none'
              }}
            >
              sop-notaufnahme.de
            </span>
          </div>
          <div style={{
            minWidth: '100px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}>
            {isHospitalLicense ? <HospitalLicenseBadge /> : <CCSymbols />}
          </div>
        </div>

        {/* Disclaimer Text */}
        {hasDisclaimer && (
          <p style={{
            fontFamily: "'Roboto', sans-serif",
            fontWeight: 400,
            fontSize: '10px',
            lineHeight: '15px',
            color: '#003366',
            letterSpacing: '0.1px',
            width: '100%',
            margin: 0
          }}>
            Unsere Leitfäden sollen dich in deinem medizinischen Alltag unterstützen. Sie erheben jedoch keinen Anspruch auf Richtigkeit sowie Vollständigkeit und sind daher ohne Gewähr. Insbesondere sind sie in keiner Weise ein Ersatz für professionelle Diagnosen, Beratungen oder Behandlungen durch approbierte ÄrztInnen & dürfen deshalb nicht als Grundlage für eigenständige Diagnosen sowie Behandlungen oder Änderungen an einer bereits empfohlenen Behandlung herangezogen werden.
          </p>
        )}

        {/* Signature Fields */}
        {hasSignature && (
          <div style={{ paddingTop: '8px', paddingBottom: '12px', width: '100%' }}>
            <SignatureFields />
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="sop-footer" 
      onClick={handleFooterClick}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        paddingTop: `${FOOTER.PADDING.TOP}px`,
        paddingLeft: `${FOOTER.PADDING.LEFT}px`,
        paddingRight: `${FOOTER.PADDING.RIGHT}px`,
        paddingBottom: `${FOOTER.PADDING.BOTTOM}px`
      }}
    >
      {/* Footer Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}>
        {variant === 'tiny' ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}>
            {renderFooterContent()}
          </div>
        ) : variant === 'placeholder' ? (
          <div 
            className="placeholder-footer-box"
            style={{
              backgroundColor: '#E5F2FF',
              border: '1px dashed #3399FF',
              borderRadius: '6px',
              paddingTop: '16px',
              paddingBottom: '12px',
              paddingLeft: '26px',
              paddingRight: '26px',
              width: '100%',
              position: 'relative'
            }}
          >
            <PlaceholderContent />
          </div>
        ) : (
          <div style={{
            backgroundColor: '#FAFAFA',
            border: '1.25px solid #FAFAFA',
            borderRadius: '6px',
            paddingTop: '16px',
            paddingBottom: '12px',
            paddingLeft: '26px',
            paddingRight: '26px',
            width: '100%'
          }}>
            {renderFooterContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SOPFooter;

