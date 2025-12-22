/**
 * POST /list-prs endpoint - List GitHub pull requests for a project
 */

import type { Request, Response } from 'express';
import { execAsync, execEnv, getErrorMessage, logError } from './common.js';
import { checkGitHubRemote } from './check-github-remote.js';

export interface GitHubLabel {
  name: string;
  color: string;
}

export interface GitHubAuthor {
  login: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  state: string;
  author: GitHubAuthor;
  createdAt: string;
  labels: GitHubLabel[];
  url: string;
  isDraft: boolean;
  headRefName: string;
  reviewDecision: string | null;
  mergeable: string;
  body: string;
}

export interface ListPRsResult {
  success: boolean;
  prs?: GitHubPR[];
  openPRs?: GitHubPR[];
  mergedPRs?: GitHubPR[];
  error?: string;
}

export function createListPRsHandler() {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectPath } = req.body;

      if (!projectPath) {
        res.status(400).json({ success: false, error: 'projectPath is required' });
        return;
      }

      // First check if this is a GitHub repo
      const remoteStatus = await checkGitHubRemote(projectPath);
      if (!remoteStatus.hasGitHubRemote) {
        res.status(400).json({
          success: false,
          error: 'Project does not have a GitHub remote',
        });
        return;
      }

      // Fetch open PRs
      const { stdout: openStdout } = await execAsync(
        'gh pr list --state open --json number,title,state,author,createdAt,labels,url,isDraft,headRefName,reviewDecision,mergeable,body --limit 100',
        {
          cwd: projectPath,
          env: execEnv,
        }
      );

      // Fetch merged PRs
      const { stdout: mergedStdout } = await execAsync(
        'gh pr list --state merged --json number,title,state,author,createdAt,labels,url,isDraft,headRefName,reviewDecision,mergeable,body --limit 50',
        {
          cwd: projectPath,
          env: execEnv,
        }
      );

      const openPRs: GitHubPR[] = JSON.parse(openStdout || '[]');
      const mergedPRs: GitHubPR[] = JSON.parse(mergedStdout || '[]');

      res.json({
        success: true,
        openPRs,
        mergedPRs,
        prs: [...openPRs, ...mergedPRs],
      });
    } catch (error) {
      logError(error, 'List GitHub PRs failed');
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  };
}
