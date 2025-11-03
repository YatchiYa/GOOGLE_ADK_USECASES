import { useState, useEffect } from 'react';

interface GmailAuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  isLoading: boolean;
  error: string | null;
}

interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  user_email?: string;
  expires_in?: number;
}

export const useGmailAuth = () => {
  const [authState, setAuthState] = useState<GmailAuthState>({
    isAuthenticated: false,
    userEmail: null,
    isLoading: true,
    error: null,
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('http://localhost:8000/gmail/status');
      const data = await response.json();
      
      setAuthState({
        isAuthenticated: data.authenticated || false,
        userEmail: data.user_email || null,
        isLoading: false,
        error: data.error || null,
      });
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        userEmail: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check auth status',
      });
    }
  };

  const updateTokens = async (tokens: GmailTokens) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('http://localhost:8000/gmail/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokens),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAuthState({
          isAuthenticated: true,
          userEmail: data.data.user_email || tokens.user_email || null,
          isLoading: false,
          error: null,
        });
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message || 'Failed to update tokens');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tokens';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      userEmail: null,
      isLoading: false,
      error: null,
    });
  };

  return {
    ...authState,
    updateTokens,
    logout,
    checkAuthStatus,
  };
};
