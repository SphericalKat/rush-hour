import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchLatestRelease,
  isGitHubDistribution,
  isNewer,
  registerUpdateTask,
  type GitHubRelease,
} from '../lib/updates';

if (isGitHubDistribution()) {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export interface AppUpdate {
  release: GitHubRelease;
  downloadUrl: string;
}

export function useAppUpdate() {
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const check = useCallback(async (notify: boolean) => {
    try {
      const release = await fetchLatestRelease();
      const currentVersion = Constants.expoConfig?.version ?? '0.0.0';

      if (!isNewer(release.tag_name, currentVersion)) return;

      const downloadUrl = release.html_url;
      setUpdate({ release, downloadUrl });

      if (notify && isGitHubDistribution()) {
        const Notifications = require('expo-notifications');
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Update available',
            body: `Rush Hour ${release.tag_name} is available. Tap to download.`,
            data: { url: downloadUrl },
          },
          trigger: null,
        });
      }
    } catch {
      // silently ignore — network errors, no releases, etc.
    }
  }, []);

  // automatic check on mount + register background task
  useEffect(() => {
    if (!isGitHubDistribution()) return;

    (async () => {
      await registerUpdateTask();
      await check(true);
    })();
  }, [check]);

  // manual check from settings
  const checkNow = useCallback(async () => {
    setCheckingUpdate(true);
    try {
      await check(false);
    } finally {
      setCheckingUpdate(false);
    }
  }, [check]);

  return {
    update,
    showBanner: update !== null && !dismissed,
    dismiss: () => setDismissed(true),
    checkNow,
    checkingUpdate,
  };
}
