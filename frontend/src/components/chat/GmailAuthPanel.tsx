import React from 'react';
import GmailConnectionPanel from '@/src/components/tools/GmailConnectionPanel';

interface GmailAuthPanelProps {
  onAuthSuccess?: () => void;
}

export const GmailAuthPanel: React.FC<GmailAuthPanelProps> = ({ onAuthSuccess }) => {
  const handleConnectionChange = (connected: boolean) => {
    if (connected) {
      onAuthSuccess?.();
    }
  };

  return (
    <div className="w-full">
      <GmailConnectionPanel
        agentId="gmail_expert"
        onConnectionChange={handleConnectionChange}
        className="w-full"
      />
    </div>
  );
};
