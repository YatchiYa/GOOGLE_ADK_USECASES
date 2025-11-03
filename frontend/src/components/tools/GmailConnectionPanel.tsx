"use client";

import { useState, useEffect } from "react";
import {
  FaGoogle,
  FaEnvelope,
  FaCheck,
  FaExclamationTriangle,
  FaSync,
  FaRocket,
  FaInbox,
  FaStar,
  FaExclamation,
} from "react-icons/fa";

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
          hasGrantedAllScopes: (tokenResponse: any, ...scopes: string[]) => boolean;
          revoke: (accessToken: string, callback?: () => void) => void;
        };
      };
    };
  }
}

interface StoredTokenData {
  access_token: string;
  expires_at: number;
  scope: string;
  user_email?: string;
}

interface GmailConnectionPanelProps {
  agentId: string;
  sessionId?: string;
  onConnectionChange?: (connected: boolean) => void;
  className?: string;
}

interface EmailStats {
  total_messages: number;
  total_threads: number;
  unread_count: number;
  today_count: number;
  important_count: number;
  starred_count: number;
}

export default function GmailConnectionPanel({
  agentId,
  sessionId,
  onConnectionChange,
  className = "",
}: GmailConnectionPanelProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncingTokens, setSyncingTokens] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Gmail OAuth configuration
  const CLIENT_ID = "1061274116595-d1hcu5flfii0nih95ot52npmbfpdd0hg.apps.googleusercontent.com";
  const API_KEY = "AIzaSyCZqOH8LRqNFlOJV-p8V0U-XXyD1IcIElg";
  const SCOPES = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";
  const STORAGE_KEY = "gmail_auth_token";

  useEffect(() => {
    initializeGoogleIdentity();
  }, []);

  const initializeGoogleIdentity = async () => {
    try {
      // Load stored token if available
      await loadStoredToken();
      
      // Load Google Identity Services script
      await loadGoogleIdentityScript();
      
      // Initialize the OAuth2 token client
      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: handleTokenResponse,
        });
        setTokenClient(client);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize Google Identity Services:', error);
      setSyncError('Failed to initialize Gmail connection');
    }
  };

  const loadGoogleIdentityScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        const checkLoaded = () => {
          if (window.google?.accounts?.oauth2) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        setTimeout(() => {
          if (window.google?.accounts?.oauth2) {
            resolve();
          } else {
            reject(new Error('Google Identity Services loaded but API not available'));
          }
        }, 100);
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
      document.head.appendChild(script);
    });
  };

  const loadStoredToken = async (): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const tokenData: StoredTokenData = JSON.parse(storedData);
          
          // Check if token is still valid (with 5 minute buffer)
          if (tokenData.expires_at > Date.now() + 300000) {
            setAccessToken(tokenData.access_token);
            setTokenExpiresAt(tokenData.expires_at);
            setUserEmail(tokenData.user_email || null);
            setIsConnected(true);
            onConnectionChange?.(true);
            
            // Load email stats and sync with backend
            loadEmailStats(tokenData.access_token);
            syncTokensWithAgent(tokenData.access_token, tokenData.user_email);
            
            console.log('✅ Loaded valid Gmail token from storage');
            console.log('🔑 Access Token:', tokenData.access_token);
          } else {
            // Token expired, remove it
            localStorage.removeItem(STORAGE_KEY);
            console.log('⏰ Stored Gmail token expired, removed from storage');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load stored token:', error);
    }
  };

  const handleTokenResponse = (tokenResponse: any): void => {
    if (tokenResponse.error) {
      console.error('Token response error:', tokenResponse.error);
      setSyncError(`Authentication failed: ${tokenResponse.error}`);
      return;
    }

    const newAccessToken = tokenResponse.access_token;
    const expiresIn = tokenResponse.expires_in || 3600;
    const newTokenExpiresAt = Date.now() + (expiresIn * 1000);

    setAccessToken(newAccessToken);
    setTokenExpiresAt(newTokenExpiresAt);
    setIsConnected(true);
    onConnectionChange?.(true);
    setSyncError(null);

    // Console log the token for debugging
    console.log('🎉 Gmail authentication successful!');
    console.log('🔑 Access Token:', newAccessToken);
    console.log('⏰ Expires at:', new Date(newTokenExpiresAt));
    console.log('📧 Scopes:', tokenResponse.scope);

    // Get user profile to extract email
    getUserProfile(newAccessToken).then((email) => {
      if (email) {
        setUserEmail(email);
        console.log('👤 User Email:', email);
      }
      
      // Store token data
      storeToken({
        access_token: newAccessToken,
        expires_at: newTokenExpiresAt,
        scope: tokenResponse.scope || SCOPES,
        user_email: email
      });

      // Load email stats and sync with agent
      loadEmailStats(newAccessToken);
      // Always sync tokens with backend (not dependent on sessionId)
      syncTokensWithAgent(newAccessToken, email);
    });
  };

  const storeToken = (tokenData: StoredTokenData): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenData));
        console.log('💾 Gmail token stored successfully');
      }
    } catch (error) {
      console.error('Failed to store token in localStorage:', error);
    }
  };

  const getUserProfile = async (token: string): Promise<string | null> => {
    try {
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        const profile = await response.json();
        return profile.emailAddress;
      }
    } catch (error) {
      console.error('Failed to get user profile:', error);
    }
    return null;
  };

  const handleGoogleLogin = async () => {
    if (!tokenClient || !isInitialized) {
      setSyncError('Gmail connection not initialized. Please refresh the page.');
      return;
    }

    try {
      setSyncError(null);
      console.log('🚀 Initiating Gmail sign-in...');
      
      // Request access token
      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Gmail login failed:', error);
      setSyncError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleGoogleLogout = () => {
    try {
      if (accessToken && window.google?.accounts?.oauth2) {
        // Revoke the token
        window.google.accounts.oauth2.revoke(accessToken, () => {
          console.log('🔓 Gmail token revoked');
        });
      }

      // Clear all state
      setAccessToken(null);
      setTokenExpiresAt(null);
      setIsConnected(false);
      setUserEmail(null);
      setEmailStats(null);
      setLastSync(null);
      setSyncError(null);
      onConnectionChange?.(false);
      
      // Clear storage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY);
      }
      
      console.log('👋 Gmail disconnected successfully');
    } catch (error) {
      console.error('Gmail logout failed:', error);
    }
  };

  const loadEmailStats = async (accessToken: string) => {
    try {
      setLoadingStats(true);

      const response = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/profile",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load Gmail profile");
      }

      const profile = await response.json();

      // Get additional stats
      const [
        unreadResponse,
        todayResponse,
        importantResponse,
        starredResponse,
      ] = await Promise.all([
        fetch(
          "https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=1",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        ),
        fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages?q=after:${
            new Date().toISOString().split("T")[0]
          }&maxResults=1`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        ),
        fetch(
          "https://www.googleapis.com/gmail/v1/users/me/messages?q=is:important&maxResults=1",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        ),
        fetch(
          "https://www.googleapis.com/gmail/v1/users/me/messages?q=is:starred&maxResults=1",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        ),
      ]);

      const [unreadData, todayData, importantData, starredData] =
        await Promise.all([
          unreadResponse.json(),
          todayResponse.json(),
          importantResponse.json(),
          starredResponse.json(),
        ]);

      const stats: EmailStats = {
        total_messages: profile.messagesTotal || 0,
        total_threads: profile.threadsTotal || 0,
        unread_count: unreadData.resultSizeEstimate || 0,
        today_count: todayData.resultSizeEstimate || 0,
        important_count: importantData.resultSizeEstimate || 0,
        starred_count: starredData.resultSizeEstimate || 0,
      };

      setEmailStats(stats);
    } catch (error) {
      console.error("Failed to load email stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const syncTokensWithAgent = async (token?: string, email?: string) => {
    const currentToken = token || accessToken;
    const currentEmail = email || userEmail;

    console.log("🔄 Starting Gmail token sync with backend...");
    console.log("   Token available:", !!currentToken);
    console.log("   User email:", currentEmail);

    if (!currentToken) {
      console.log("❌ Cannot sync: missing token");
      return;
    }

    try {
      setSyncingTokens(true);
      setSyncError(null);

      const tokenData = {
        access_token: currentToken,
        refresh_token: "",
        user_email: currentEmail || "",
        expires_in: tokenExpiresAt
          ? Math.floor((tokenExpiresAt - Date.now()) / 1000)
          : 3600,
      };

      console.log("🔄 Syncing Gmail tokens with agent:", {
        user_email: tokenData.user_email,
        expires_in: tokenData.expires_in
      });

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/gmail/tokens`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tokenData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to sync tokens");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Token sync failed");
      }

      setLastSync(new Date());
      console.log("✅ Gmail tokens synced successfully with agent");
    } catch (error) {
      console.error("❌ Gmail token sync failed:", error);
      setSyncError(
        error instanceof Error ? error.message : "Token sync failed"
      );
    } finally {
      setSyncingTokens(false);
    }
  };

  const refreshStats = () => {
    if (accessToken) {
      loadEmailStats(accessToken);
    }
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 space-y-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <FaGoogle className="h-5 w-5 text-red-500" />
        <h3 className="font-semibold text-gray-900">Gmail Connection</h3>
        {isConnected && (
          <div className="ml-auto flex items-center gap-1 text-green-600 text-sm">
            <FaCheck className="h-3 w-3" />
            <span>Connected</span>
          </div>
        )}
      </div>

      {/* Connection Status */}
      {!isConnected ? (
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={!isInitialized}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
          >
            <FaGoogle className="h-4 w-4" />
            <span>{isInitialized ? 'Connect Gmail' : 'Initializing...'}</span>
          </button>
          
          {!isInitialized && (
            <div className="text-xs text-gray-500 text-center">
              Loading Google Identity Services...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <FaGoogle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Gmail Connected
                </div>
                <div className="text-xs text-gray-600">
                  {userEmail || 'Ready to access emails'}
                </div>
              </div>
              <button
                onClick={handleGoogleLogout}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Email Stats */}
          {emailStats && (
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">
                  Email Overview
                </span>
                <button
                  onClick={refreshStats}
                  disabled={loadingStats}
                  className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                >
                  {loadingStats ? "Loading..." : "Refresh"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <FaEnvelope className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium text-gray-900">
                    {emailStats.total_messages.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <FaInbox className="h-3 w-3 text-blue-500" />
                  <span className="text-gray-600">Unread:</span>
                  <span className="font-medium text-blue-700">
                    {emailStats.unread_count.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <FaExclamation className="h-3 w-3 text-orange-500" />
                  <span className="text-gray-600">Important:</span>
                  <span className="font-medium text-orange-700">
                    {emailStats.important_count.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <FaStar className="h-3 w-3 text-yellow-500" />
                  <span className="text-gray-600">Starred:</span>
                  <span className="font-medium text-yellow-700">
                    {emailStats.starred_count.toLocaleString()}
                  </span>
                </div>

                <div className="col-span-2 flex items-center gap-1">
                  <FaEnvelope className="h-3 w-3 text-green-500" />
                  <span className="text-gray-600">Today:</span>
                  <span className="font-medium text-green-700">
                    {emailStats.today_count.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sync Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => syncTokensWithAgent()}
              disabled={syncingTokens || !sessionId}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
            >
              {syncingTokens ? (
                <FaSync className="h-3 w-3 animate-spin" />
              ) : (
                <FaRocket className="h-3 w-3" />
              )}
              <span>{syncingTokens ? "Syncing..." : "Sync with Agent"}</span>
            </button>

            {lastSync && (
              <span className="text-xs text-gray-500">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Sync Error */}
          {syncError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <FaExclamationTriangle className="h-4 w-4" />
                <span className="font-medium">Sync Error</span>
              </div>
              <div className="text-xs text-red-600 mt-1">{syncError}</div>
              <button
                onClick={() => setSyncError(null)}
                className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-gray-500 bg-red-50 rounded-lg p-3">
            <div className="font-medium text-red-800 mb-1">
              📧 Gmail Integration:
            </div>
            <div className="space-y-1">
              <div>
                • Read and list your emails (unread, today, important, etc.)
              </div>
              <div>• Get email statistics and summaries</div>
              <div>• Search through your email history</div>
              <div>• Your agent can now access Gmail data!</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
