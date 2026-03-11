import Constants from 'expo-constants';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

const GITHUB_REPO = 'SphericalKat/rush-hour';
export const UPDATE_CHECK_TASK = 'check-app-update';

export interface GitHubRelease {
  tag_name: string;
  html_url: string;
  name: string;
  body: string;
  published_at: string;
  assets: { name: string; browser_download_url: string }[];
}

export function isGitHubDistribution(): boolean {
  return process.env['EXPO_PUBLIC_DISTRIBUTION'] === 'github';
}

/** Compare semver strings. Returns true when remote > local. */
export function isNewer(remoteTag: string, localVersion: string): boolean {
  const parse = (v: string) =>
    v.replace(/^v/, '').split('.').map(Number);
  const [rMajor = 0, rMinor = 0, rPatch = 0] = parse(remoteTag);
  const [lMajor = 0, lMinor = 0, lPatch = 0] = parse(localVersion);
  if (rMajor !== lMajor) return rMajor > lMajor;
  if (rMinor !== lMinor) return rMinor > lMinor;
  return rPatch > lPatch;
}

export async function fetchLatestRelease(): Promise<GitHubRelease> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
    { headers: { Accept: 'application/vnd.github+json' } },
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json() as Promise<GitHubRelease>;
}

/** Shared logic for checking updates and sending a notification. */
export async function checkAndNotify(): Promise<boolean> {
  const release = await fetchLatestRelease();
  const currentVersion = Constants.expoConfig?.version ?? '0.0.0';

  if (!isNewer(release.tag_name, currentVersion)) return false;

  const Notifications = require('expo-notifications');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Update available',
      body: `Rush Hour ${release.tag_name} is available. Tap to download.`,
      data: { url: release.html_url },
    },
    trigger: null,
  });

  return true;
}

// Register background task at module level so the OS can invoke it.
TaskManager.defineTask(UPDATE_CHECK_TASK, async () => {
  if (!isGitHubDistribution()) return BackgroundTask.BackgroundTaskResult.Failed;

  try {
    const found = await checkAndNotify();
    return found
      ? BackgroundTask.BackgroundTaskResult.Success
      : BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Register the periodic background task. Call once on app start. */
export async function registerUpdateTask() {
  if (!isGitHubDistribution()) return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(UPDATE_CHECK_TASK);
  if (isRegistered) return;

  await BackgroundTask.registerTaskAsync(UPDATE_CHECK_TASK, {
    minimumInterval: 60, // 60 minutes
  });
}
