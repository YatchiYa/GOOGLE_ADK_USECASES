import React from 'react';

export const StreamingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1">
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-xs text-blue-600">Streaming</span>
    </div>
  );
};
