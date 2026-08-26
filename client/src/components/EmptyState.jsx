import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionLink 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <Icon size={48} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-xl font-bold text-text mb-2">{title}</h3>
      <p className="text-text-muted mb-6 max-w-sm">{description}</p>
      
      {actionLabel && actionLink && (
        <Link to={actionLink}>
          <Button variant="primary">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
