import React from 'react';

const AmbientBackground = ({ mode = 'day' }) => {
  const isNight = mode === 'night';

  return (
    <div 
      className={`fixed inset-0 w-full h-full -z-50 transition-colors duration-1000 overflow-hidden pointer-events-none ${
        isNight ? 'bg-[#24252c]' : 'bg-[#ebd7bc]'
      }`}
    >
      {/* Day Mode Layers */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${isNight ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Morning Glow */}
        <div 
          className="absolute inset-0 mix-blend-overlay"
          style={{
            background: 'linear-gradient(0deg, #3f44469e 40%, #8cd2ef)',
            zIndex: 10
          }}
        />
        
        {/* Top Accent */}
        <div 
          className="absolute w-[200vw] h-[100vw] -top-[170vw] -left-[20vw] rounded-full mix-blend-plus-lighter opacity-5 blur-[4vw]"
          style={{
            background: 'conic-gradient(from 12deg at bottom, #fffee050, #fff 27deg 31deg, #fdffec00 92deg)',
            transform: 'rotate(197deg)'
          }}
        />

        {/* Floor Light */}
        <div 
          className="absolute w-[85vw] h-[200vw] -top-[210vw] -left-[100vw] rounded-full mix-blend-overlay opacity-30 blur-[1vw]"
          style={{
            background: 'conic-gradient(from 0deg at bottom, #fdffec00 0deg, #c79667 30deg 300deg, #fffee000 300deg)',
            transform: 'rotate(96deg)'
          }}
        />
      </div>

      {/* Night Mode Layers */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${isNight ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Color Overlay (Multiply) */}
        <div 
          className="absolute inset-0 mix-blend-multiply opacity-90"
          style={{
            background: 'linear-gradient(220deg, #04061bde, #5289ff)'
          }}
        />

        {/* Top Accent (Screen) */}
        <div 
          className="absolute inset-0 mix-blend-screen opacity-60"
          style={{
            background: 'linear-gradient(10deg, #006b72, #ff5000 60%)'
          }}
        />

        {/* Light Blue Light (Overlay) */}
        <div 
          className="absolute w-[100vw] h-[100vw] -top-[80vw] -left-[20vw] mix-blend-overlay blur-[10vw]"
          style={{
            background: 'conic-gradient(from -74deg at bottom right, transparent, #3adee7, transparent 10deg, rgba(81,77,101,.222) 20deg 80deg)'
          }}
        />

        {/* Pink Light (Plus Lighter) */}
        <div 
          className="absolute w-[50vw] h-[150vw] -top-[146vw] left-[70vw] mix-blend-plus-lighter opacity-20 blur-[3vw]"
          style={{
            background: 'conic-gradient(from 0deg at bottom left, #ffffff00, #00000000 0deg 3deg, #005779 8deg, #ff450c, #ffffff00 25deg)',
            transform: 'rotate(-80deg)'
          }}
        />

        {/* Floor Light */}
        <div 
          className="absolute w-[85vw] h-[200vw] -top-[210vw] -left-[100vw] rounded-full opacity-30 blur-[1vw]"
          style={{
            background: 'conic-gradient(from 0deg at bottom, #fdffec00 0deg, #82828e 30deg 300deg, #fffee000 300deg)',
            transform: 'rotate(96deg)'
          }}
        />
      </div>
    </div>
  );
};

export default AmbientBackground;

