import React from 'react';
import { Button } from './ui/button';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="text-center py-16 px-4">
      {Icon && (
        <Icon 
          size={48} 
          className="mx-auto mb-4 text-muted-foreground"
          weight="thin"
        />
      )}
      <h3 className="text-lg font-medium mb-2 text-foreground">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
};

export default EmptyState;

