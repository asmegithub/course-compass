import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPublicSystemSettings } from '@/lib/admin-api';
import { useTranslation } from 'react-i18next';

export interface SystemSettingsContextValue {
  settings: Record<string, string>;
  siteName: string;
  tagline: string;
  supportEmail: string;
  defaultLanguage: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  requireEmailVerification: boolean;
  isLoading: boolean;
  refetch: () => void;
}

const SystemSettingsContext = createContext<SystemSettingsContextValue | undefined>(undefined);

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();

  const { data: publicSettings = [], isLoading, refetch } = useQuery({
    queryKey: ['public-system-settings'],
    queryFn: getPublicSystemSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const settingsMap = useMemo(() => {
    const map: Record<string, string> = {};
    publicSettings.forEach((s) => {
      if (s.key && s.value != null) {
        map[s.key] = s.value;
        map[s.key.toUpperCase()] = s.value;
      }
    });
    return map;
  }, [publicSettings]);

  const siteName = settingsMap['SITE_NAME'] || settingsMap['SITENAME'] || t('common.brand') || 'BeteGubae';
  const tagline = settingsMap['SITE_TAGLINE'] || settingsMap['TAGLINE'] || t('home.footerTagline') || 'Ethiopia\'s Premier Learning Platform';
  const supportEmail = settingsMap['SUPPORT_EMAIL'] || 'support@BeteGubae.et';
  const defaultLanguage = settingsMap['DEFAULT_LANGUAGE'] || 'en';
  const maintenanceMode = settingsMap['MAINTENANCE_MODE'] === 'true';
  const registrationOpen = settingsMap['REGISTRATION_OPEN'] !== 'false';
  const requireEmailVerification = settingsMap['REQUIRE_EMAIL_VERIFICATION'] !== 'false';

  useEffect(() => {
    if (siteName) {
      document.title = tagline ? `${siteName} - ${tagline}` : siteName;
    }
  }, [siteName, tagline]);

  const value = useMemo(
    () => ({
      settings: settingsMap,
      siteName,
      tagline,
      supportEmail,
      defaultLanguage,
      maintenanceMode,
      registrationOpen,
      requireEmailVerification,
      isLoading,
      refetch,
    }),
    [
      settingsMap,
      siteName,
      tagline,
      supportEmail,
      defaultLanguage,
      maintenanceMode,
      registrationOpen,
      requireEmailVerification,
      isLoading,
      refetch,
    ]
  );

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = (): SystemSettingsContextValue => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    return {
      settings: {},
      siteName: 'BeteGubae',
      tagline: 'Ethiopia\'s Premier Learning Platform',
      supportEmail: 'support@BeteGubae.et',
      defaultLanguage: 'en',
      maintenanceMode: false,
      registrationOpen: true,
      requireEmailVerification: true,
      isLoading: false,
      refetch: () => {},
    };
  }
  return context;
};
