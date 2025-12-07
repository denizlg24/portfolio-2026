import { InstagramPostsGallery } from "./instagram-posts-gallery";

const getInstagramPosts = async () => {
  const URL = process.env.INSTAGRAM_POSTS_URL!;
  const res = await fetch(URL, {
    next: { revalidate: 2592000 },
  });

  if (!res.ok) {
    return [];
  }

  const data: {
    posts: { timestamp: string; permalink: string; mediaUrl: string }[];
  } = await res.json();
  return data.posts;
};

export default async function Home() {
  const posts = await getInstagramPosts();
  return (
    <main className="flex flex-col items-center justify-center">
      <section className="w-full max-w-4xl mx-auto px-4 text-center items-center">
        <h1 className="sm:text-5xl text-4xl text-balance font-calistoga text-center">
          hi, deniz here.
        </h1>
        <h2 className="mt-2 whitespace-nowrap text-sm font-medium sm:text-base text-center">
          21 yo software engineer from Portugal
        </h2>
      </section>
      <InstagramPostsGallery
        items={posts.map((post) => ({
          image: post.mediaUrl,
          text: new Date(post.timestamp).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          link: post.permalink,
        }))}
      />
    </main>
  );
}
