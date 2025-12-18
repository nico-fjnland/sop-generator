import React, { useMemo } from 'react';
import { Check, Warning, X, Info } from '@phosphor-icons/react';
import { Spinner } from './ui/spinner';
import { useStatus } from '../contexts/StatusContext';
import AnimatedGradient from './fancy/background/animated-gradient-with-svg';
import './StatusIndicator.css';

/**
 * Color palettes for each status type
 * Each palette contains the main color + a lighter variant
 */
const STATUS_GRADIENT_COLORS = {
  // Blue palette (info, saving, exporting, synced)
  blue: ['#39F', '#7BBFFF', '#39F'],
  // Green palette (success)
  green: ['#52C41A', '#85D95C', '#52C41A'],
  // Red palette (error, confirm)
  red: ['#EB5547', '#FF8A7A', '#EB5547'],
  // Yellow palette (warning)
  yellow: ['#FAAD14', '#FFCC5C', '#FAAD14'],
};

/**
 * StatusIndicator - A wrapper component that displays status as a frame around its children
 * The frame expands from behind the toolbar with status text in the top border
 * Uses StatusContext for global status management
 */
const StatusIndicator = ({ children }) => {
  const { currentStatus, isVisible, isHiding, handleConfirm, handleCancel } = useStatus();

  const getStatusIcon = () => {
    if (!currentStatus) return null;
    
    switch (currentStatus.type) {
      case 'success':
      case 'synced':
        return <Check size={16} weight="bold" />;
      case 'error':
      case 'confirm':
        return <Warning size={16} weight="bold" />;
      case 'warning':
        return <Warning size={16} weight="bold" />;
      case 'info':
        return <Info size={16} weight="bold" />;
      case 'saving':
      case 'exporting':
        return <Spinner size="sm" />;
      default:
        return <Check size={16} weight="bold" />;
    }
  };

  const getBackgroundColor = () => {
    if (!currentStatus) return '#39F';
    return currentStatus.color || '#39F';
  };

  // Get gradient colors based on status type
  const gradientColors = useMemo(() => {
    if (!currentStatus) return STATUS_GRADIENT_COLORS.blue;
    
    switch (currentStatus.type) {
      case 'success':
        return STATUS_GRADIENT_COLORS.green;
      case 'error':
      case 'confirm':
        return STATUS_GRADIENT_COLORS.red;
      case 'warning':
        return STATUS_GRADIENT_COLORS.yellow;
      default:
        return STATUS_GRADIENT_COLORS.blue;
    }
  }, [currentStatus?.type]);

  const isConfirmDialog = currentStatus?.isConfirm;

  return (
    <div className="status-indicator-wrapper">
      {/* The expanding frame behind the toolbar */}
      <div 
        className={`status-frame ${isVisible ? 'visible' : ''} ${isHiding ? 'hiding' : ''} ${isConfirmDialog ? 'confirm-dialog' : ''}`}
        style={{ backgroundColor: getBackgroundColor() }}
      >
        {/* Animated gradient background */}
        <div className="status-gradient-container">
          <AnimatedGradient 
            colors={gradientColors}
            speed={8}
            blur="medium"
          />
        </div>
        {/* Status text area at the top */}
        <div className="status-header">
          <span className="status-icon">
            {getStatusIcon()}
          </span>
          <span className="status-text">
            {currentStatus?.message || 'Synchronisiert'}
          </span>
          
          {/* Confirm dialog buttons - icon only */}
          {isConfirmDialog && (
            <div className="status-buttons">
              <button 
                className="status-btn status-btn-cancel"
                onClick={handleCancel}
                title={currentStatus.cancelLabel || 'Abbrechen'}
              >
                <X size={16} weight="bold" />
              </button>
              <button 
                className="status-btn status-btn-confirm"
                onClick={handleConfirm}
                title={currentStatus.confirmLabel || 'Bestätigen'}
              >
                <Check size={16} weight="bold" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* The actual toolbar content */}
      <div className="toolbar-content">
        {children}
      </div>
    </div>
  );
};

export default StatusIndicator;
