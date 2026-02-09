import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { GitCommit, GitMerge, GitPullRequest } from "lucide-react";

async function fetchGitHub(query: string, variables: Record<string, unknown>) {
  const result = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await result.json();
  return data.data;
}

interface Commit {
  oid: string;
  messageHeadline: string;
  committedDate: string;
  url: string;
  repoName: string;
}

export async function GitHubRecentCommits() {
  const data = await fetchGitHub(
    `
      query ($username: String!) {
        user(login: $username) {
          repositories(
            first: 10
            orderBy: { field: PUSHED_AT, direction: DESC }
            ownerAffiliations: OWNER
          ) {
            nodes {
              name
              defaultBranchRef {
                target {
                  ... on Commit {
                    history(first: 3) {
                      nodes {
                        oid
                        messageHeadline
                        committedDate
                        url
                        author {
                          user {
                            login
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    { username: "denizlg24" },
  );

  const commits: Commit[] = [];

  for (const repo of data.user.repositories.nodes) {
    if (!repo.defaultBranchRef?.target?.history?.nodes) continue;
    for (const commit of repo.defaultBranchRef.target.history.nodes) {
      if (commit.author?.user?.login !== "denizlg24") continue;
      commits.push({
        oid: commit.oid,
        messageHeadline: commit.messageHeadline,
        committedDate: commit.committedDate,
        url: commit.url,
        repoName: repo.name,
      });
    }
  }

  commits.sort(
    (a, b) =>
      new Date(b.committedDate).getTime() -
      new Date(a.committedDate).getTime(),
  );
  const top = commits.slice(0, 10);

  return (
    <div className="flex flex-col gap-3 w-full">
      {top.map((commit) => (
        <a
          key={commit.oid}
          href={commit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
        >
          <GitCommit className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm leading-snug line-clamp-1">
              {commit.messageHeadline}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {commit.repoName}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(commit.committedDate), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

export function GitHubRecentCommitsSkeleton() {
  return (
    <div className="flex flex-col gap-3 w-full">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
          <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface PullRequest {
  title: string;
  url: string;
  createdAt: string;
  state: "OPEN" | "MERGED" | "CLOSED";
  repository: {
    name: string;
  };
}

const PR_STATUS: Record<
  PullRequest["state"],
  { label: string; className: string; icon: typeof GitPullRequest }
> = {
  OPEN: {
    label: "Open",
    className: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
    icon: GitPullRequest,
  },
  MERGED: {
    label: "Merged",
    className: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    icon: GitMerge,
  },
  CLOSED: {
    label: "Closed",
    className: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    icon: GitPullRequest,
  },
};

export async function GitHubRecentPRs() {
  const data = await fetchGitHub(
    `
      query ($username: String!) {
        user(login: $username) {
          pullRequests(
            first: 10
            orderBy: { field: CREATED_AT, direction: DESC }
          ) {
            nodes {
              title
              url
              createdAt
              state
              repository {
                name
              }
            }
          }
        }
      }
    `,
    { username: "denizlg24" },
  );

  const prs: PullRequest[] = data.user.pullRequests.nodes;

  return (
    <div className="flex flex-col gap-3 w-full">
      {prs.map((pr) => {
        const status = PR_STATUS[pr.state];
        const Icon = status.icon;
        return (
          <a
            key={pr.url}
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm leading-snug line-clamp-1">{pr.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {pr.repository.name}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${status.className}`}
                >
                  {status.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(pr.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function GitHubRecentPRsSkeleton() {
  return (
    <div className="flex flex-col gap-3 w-full">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
          <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
