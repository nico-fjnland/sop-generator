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
  const { currentStatus, isVisible, isHiding } = useStatus();

  const getStatusIcon = () => {
    if (!currentStatus) return null;
    
    switch (currentStatus.type) {
      case 'success':
      case 'synced':
        return <Check size={14} weight="bold" />;
      case 'error':
        return <X size={14} weight="bold" />;
      case 'warning':
        return <Warning size={14} weight="bold" />;
      case 'info':
        return <Info size={14} weight="bold" />;
      case 'saving':
      case 'exporting':
        return <Spinner size="sm" />;
      default:
        return <Check size={14} weight="bold" />;
    }
  };

  const getBackgroundColor = () => {
    if (!currentStatus) return '#39F';
    return currentStatus.color || '#39F';
  };

  return (
    <div className="status-indicator-wrapper">
      {/* The expanding frame behind the toolbar */}
      <div 
        className={`status-frame ${isVisible ? 'visible' : ''} ${isHiding ? 'hiding' : ''}`}
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
