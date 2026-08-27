/** The subset of GitHub's repository payload used by the public REST integration. */
export interface GitHubApiRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  fork: boolean;
  archived: boolean;
  visibility?: string | null;
}

/** Stable application-level representation, isolated from GitHub's wire format. */
export interface GitHubRepository {
  externalId: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  primaryLanguage: string | null;
  topics: string[];
  stars: number;
  forks: number;
  createdAt: Date;
  updatedAt: Date;
  pushedAt: Date | null;
  isFork: boolean;
  isArchived: boolean;
  visibility: string | null;
}

export interface GitHubSyncSummary {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
}
