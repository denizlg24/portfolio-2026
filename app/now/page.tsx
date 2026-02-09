import { Suspense } from "react";
import {
  GitHubContributions,
  GitHubContributionsSkeleton,
} from "./github-contributions";
import {
  GitHubRecentCommits,
  GitHubRecentCommitsSkeleton,
  GitHubRecentPRs,
  GitHubRecentPRsSkeleton,
} from "./github-activity";
import { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    absolute: "Now | Deniz Lopes Güneş",
  },
  description:
    "Discover what I'm up to right now, including my latest projects, learning endeavors, and real-time updates on my software development journey.",
  openGraph: {
    title: "Now | Deniz Lopes Güneş",
    description:
      "Discover what I'm up to right now, including my latest projects, learning endeavors, and real-time updates on my software development journey.",
    url: "https://denizlg24.com/now",
  },
};

export default function Page() {
  return (
    <main className="flex flex-col items-center min-h-screen">
      <section className="w-full max-w-5xl mx-auto px-4 text-center items-center">
        <h1 className="sm:text-5xl text-4xl text-balance font-calistoga text-center">
          now.
        </h1>
        <h2 className="text-sm font-medium sm:text-base text-center">check out what i've been working on lately</h2>
        <div className="my-12"></div>
        <Suspense fallback={<GitHubContributionsSkeleton />}>
          <GitHubContributions />
        </Suspense>
        <div className="mt-12">
          <h2 className="text-2xl font-calistoga text-left mb-4">
            recent commits
          </h2>
          <Suspense fallback={<GitHubRecentCommitsSkeleton />}>
            <GitHubRecentCommits />
          </Suspense>
        </div>
        <div className="mt-12">
          <h2 className="text-2xl font-calistoga text-left mb-4">
            pull requests
          </h2>
          <Suspense fallback={<GitHubRecentPRsSkeleton />}>
            <GitHubRecentPRs />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
