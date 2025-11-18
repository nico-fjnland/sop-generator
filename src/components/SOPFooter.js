import React, { useState } from 'react';

const FOOTER_VARIANTS = [
  { id: 'tiny', label: 'Tiny', height: 69 },
  { id: 'small', label: 'Small', height: 122 },
  { id: 'large', label: 'Large', height: 204 },
  { id: 'x-large', label: 'X-Large', height: 249 },
];

// Image assets from Figma
const imgVector = "http://localhost:3845/assets/b52459cbe1a3ba5e4dbd763455e40cfe93cbaadd.svg";
const imgCcSymbole = "http://localhost:3845/assets/85c2e08be9d26df40890ad4f5e2f23e3ce0b070a.svg";
const imgIconEndokrinologie = "http://localhost:3845/assets/cd35fbcb165f1ddf2fcd149c4bdf816d4d3c1347.svg";
const imgIconGastroenterologie = "http://localhost:3845/assets/41c84427ef1c1a164abc53d3841e2a065d347192.svg";
const imgHamatoOnkologie = "http://localhost:3845/assets/3762b8bf86a764d77f82dc955b754b7e0fc8d649.svg";
const imgIconInfektiologie = "http://localhost:3845/assets/dab180642f406c7a08b43eac114dad9fa5488c10.svg";
const imgIconKardiologie = "http://localhost:3845/assets/c17f3d5052ca0a50f2c72549ed172bc1f47f0187.svg";
const imgIconElektrolyteNiere = "http://localhost:3845/assets/fa70cf426e3a1ee9494354c44767976c41063c0e.svg";
const imgIconNeurologie = "http://localhost:3845/assets/b5f1d886321559b6f13e2d57f3f77efa0ac23ba0.svg";
const imgIconPneumologie = "http://localhost:3845/assets/32f247b242deab09994a844bf84ec7c8af65ae97.svg";

const MEDICAL_FIELDS = [
  { id: 'endokrinologie', label: 'Endokrinologie', icon: imgIconEndokrinologie, width: 17.368, height: 20.04 },
  { id: 'gastroenterologie', label: 'Gastroenterologie', icon: imgIconGastroenterologie, width: 18.038, height: 20.04 },
  { id: 'hamato-onkologie', label: 'Hämato-/Onkologie', icon: imgHamatoOnkologie, width: 20, height: 20 },
  { id: 'infektiologie', label: 'Infektiologie', icon: imgIconInfektiologie, width: 20.039, height: 20.04 },
  { id: 'kardiologie', label: 'Kardiologie', icon: imgIconKardiologie, width: 20.04, height: 20.04 },
  { id: 'nephrologie', label: 'Nephrologie', icon: imgIconElektrolyteNiere, width: 20.04, height: 20.04 },
  { id: 'neurologie', label: 'Neurologie', icon: imgIconNeurologie, width: 20.041, height: 20.04 },
  { id: 'pneumologie', label: 'Pneumologie', icon: imgIconPneumologie, width: 20.04, height: 20.04 },
];

const SOPFooter = ({ variant: initialVariant = 'tiny', onVariantChange }) => {
  const [variant, setVariant] = useState(initialVariant);

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
    const hasDisclaimer = variant === 'small' || variant === 'large' || variant === 'x-large';
    const hasFields = variant === 'large' || variant === 'x-large';
    const hasAdditionalText = variant === 'x-large';

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
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
            display: 'grid',
            gridTemplateColumns: 'max-content',
            gridTemplateRows: 'max-content',
            alignItems: 'start',
            lineHeight: 0,
            position: 'relative',
            overflow: 'visible',
            zIndex: 1
          }}>
            <div style={{
              gridArea: '1 / 1',
              width: '12px',
              height: '18px',
              marginTop: '0.5px'
            }}>
              <img src={imgVector} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
            <p
              style={{
                gridArea: '1 / 1',
                fontFamily: "'Roboto', sans-serif",
                fontWeight: 600,
                fontStyle: 'italic',
                fontSize: '10px',
                lineHeight: 1.5,
                color: '#004D99',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginLeft: '20px',
                marginTop: 0,
                whiteSpace: 'nowrap',
                userSelect: 'none'
              }}
            >
              sop-notaufnahme.de
            </p>
          </div>
          <div style={{
            width: '100px',
            height: '20px'
          }}>
            <img src={imgCcSymbole} alt="CC0" style={{ width: '100%', height: '100%', display: 'block' }} />
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

        {/* Fields Section */}
        {hasFields && (
          <>
            <p style={{
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 600,
              fontStyle: 'italic',
              fontSize: '10px',
              lineHeight: 1.5,
              color: '#003366',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              margin: 0,
              whiteSpace: 'nowrap'
            }}>
              Unsere Leitfäden nach Fachgebiet sortiert
            </p>

            {/* Additional Text for X-Large */}
            {hasAdditionalText && (
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
                Sorgfältig recherchiert, übersichtlich gestaltet und zugänglich. Das Konzept hinter unseren SOPs ist simpel. Relevante Krankheitsbilder, komprimiert auf wenige Seiten nach dem immer gleichen Schema: ein farbliches Leitsystem zum schnellen Erfassen der Informationen, konkrete Handlungsanweisungen und Dosiervorschläge von Medikamenten sowie Empfehlungen zum Entlassmanagement („Disposition").
              </p>
            )}

            {/* Medical Fields Icons */}
            <div style={{
              display: 'flex',
              gap: 0,
              alignItems: 'flex-start',
              paddingTop: 0,
              paddingBottom: 0,
              flexWrap: 'nowrap',
              justifyContent: 'space-between',
              width: '100%',
              overflow: 'hidden'
            }}>
              {MEDICAL_FIELDS.map((field) => (
                <div key={field.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: 'center',
                  flexShrink: 0,
                  flex: '1 1 0'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    flexShrink: 0
                  }}>
                    <img src={field.icon} alt={field.label} style={{ width: '100%', height: '100%', display: 'block' }} />
                  </div>
                  <p style={{
                    fontFamily: "'Roboto', sans-serif",
                    fontWeight: 400,
                    fontSize: '10px',
                    lineHeight: '15px',
                    color: '#003366',
                    letterSpacing: '0.1px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    margin: 0
                  }}>
                    {field.label}
                  </p>
                </div>
              ))}
            </div>
          </>
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
        paddingTop: '16px',
        paddingLeft: '46px',
        paddingRight: '46px',
        paddingBottom: '32px'
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
        ) : (
          <div style={{
            backgroundColor: '#FAFAFA',
            border: '1.25px solid #FAFAFA',
            borderRadius: '6px',
            paddingTop: variant === 'x-large' ? '24px' : '16px',
            paddingBottom: '12px',
            paddingLeft: '32px',
            paddingRight: '32px',
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

