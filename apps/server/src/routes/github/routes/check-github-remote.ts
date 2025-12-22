/**
 * GET /check-github-remote endpoint - Check if project has a GitHub remote
 */

import type { Request, Response } from 'express';
import { execAsync, execEnv, getErrorMessage, logError } from './common.js';

export interface GitHubRemoteStatus {
  hasGitHubRemote: boolean;
  remoteUrl: string | null;
  owner: string | null;
  repo: string | null;
}

export async function checkGitHubRemote(projectPath: string): Promise<GitHubRemoteStatus> {
  const status: GitHubRemoteStatus = {
    hasGitHubRemote: false,
    remoteUrl: null,
    owner: null,
    repo: null,
  };

  try {
    // Get the remote URL (origin by default)
    const { stdout } = await execAsync('git remote get-url origin', {
      cwd: projectPath,
      env: execEnv,
    });

    const remoteUrl = stdout.trim();
    status.remoteUrl = remoteUrl;

    // Check if it's a GitHub URL
    // Formats: https://github.com/owner/repo.git, git@github.com:owner/repo.git
    const httpsMatch = remoteUrl.match(/https:\/\/github\.com\/([^/]+)\/([^/.]+)/);
    const sshMatch = remoteUrl.match(/git@github\.com:([^/]+)\/([^/.]+)/);

    const match = httpsMatch || sshMatch;
    if (match) {
      status.hasGitHubRemote = true;
      status.owner = match[1];
      status.repo = match[2].replace(/\.git$/, '');
    }
  } catch {
    // No remote or not a git repo - that's okay
  }

  return status;
}

export function createCheckGitHubRemoteHandler() {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectPath } = req.body;

      if (!projectPath) {
        res.status(400).json({ success: false, error: 'projectPath is required' });
        return;
      }

      const status = await checkGitHubRemote(projectPath);
      res.json({
        success: true,
        ...status,
      });
    } catch (error) {
      logError(error, 'Check GitHub remote failed');
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  };
}
