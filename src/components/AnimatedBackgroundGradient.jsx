import React, { useMemo } from 'react';
import AnimatedGradient from './fancy/background/animated-gradient-with-svg';
import { useTheme } from '../contexts/ThemeContext';

// Day mode colors - Light Blue to Soft Gray with accents
const DAY_COLORS = [
  '#E5F2FF',  // Light Sky Blue
  '#B8D4F0',  // Soft Blue
  '#F4F4F4',  // Light Gray
  '#D0E8FF',  // Pale Blue
  '#FFFFFF',  // White highlight
];

// Night mode colors - Deep Midnight Blue palette
const NIGHT_COLORS = [
  '#003366',  // Deep Navy Blue
  '#004D99',  // Midnight Blue
  '#1A5C8C',  // Ocean Blue
  '#002244',  // Dark Navy
  '#0066AA',  // Bright accent
];

const AnimatedBackgroundGradient = () => {
  const { timeOfDay } = useTheme();
  const isNight = timeOfDay === 'night';

  // Memoize colors to prevent unnecessary re-renders
  const colors = useMemo(() => {
    return isNight ? NIGHT_COLORS : DAY_COLORS;
  }, [isNight]);

  return (
    <div 
      className={`fixed inset-0 -z-20 pointer-events-none transition-colors duration-1000 ${
        isNight ? 'bg-[#002244]' : 'bg-[#F0F7FF]'
      }`}
    >
      <AnimatedGradient 
        colors={colors}
        speed={120}
        blur="heavy"
      />
    </div>
  );
};

export default AnimatedBackgroundGradient;

