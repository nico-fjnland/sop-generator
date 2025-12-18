import React from 'react';
import { Check, Warning, X, Info } from '@phosphor-icons/react';
import { Spinner } from './ui/spinner';
import { useStatus } from '../contexts/StatusContext';
import './StatusIndicator.css';

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

  const isConfirmDialog = currentStatus?.isConfirm;

  return (
    <div className="status-indicator-wrapper">
      {/* The expanding frame behind the toolbar */}
      <div 
        className={`status-frame ${isVisible ? 'visible' : ''} ${isHiding ? 'hiding' : ''} ${isConfirmDialog ? 'confirm-dialog' : ''}`}
        style={{ backgroundColor: getBackgroundColor() }}
      >
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
