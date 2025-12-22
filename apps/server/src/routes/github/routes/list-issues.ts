/**
 * POST /list-issues endpoint - List GitHub issues for a project
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

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  author: GitHubAuthor;
  createdAt: string;
  labels: GitHubLabel[];
  url: string;
  body: string;
}

export interface ListIssuesResult {
  success: boolean;
  issues?: GitHubIssue[];
  openIssues?: GitHubIssue[];
  closedIssues?: GitHubIssue[];
  error?: string;
}

export function createListIssuesHandler() {
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

      // Fetch open issues
      const { stdout: openStdout } = await execAsync(
        'gh issue list --state open --json number,title,state,author,createdAt,labels,url,body --limit 100',
        {
          cwd: projectPath,
          env: execEnv,
        }
      );

      // Fetch closed issues
      const { stdout: closedStdout } = await execAsync(
        'gh issue list --state closed --json number,title,state,author,createdAt,labels,url,body --limit 50',
        {
          cwd: projectPath,
          env: execEnv,
        }
      );

      const openIssues: GitHubIssue[] = JSON.parse(openStdout || '[]');
      const closedIssues: GitHubIssue[] = JSON.parse(closedStdout || '[]');

      res.json({
        success: true,
        openIssues,
        closedIssues,
        issues: [...openIssues, ...closedIssues],
      });
    } catch (error) {
      logError(error, 'List GitHub issues failed');
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  };
}
