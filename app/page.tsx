import { InstagramPostsGallery } from "@/components/instagram-posts-gallery";
import portugalFlag from "@/public/portugal-flag.svg";
import { getInstagramPosts } from "@/lib/instagram_posts";
import { getAge } from "@/lib/utils";
import Image from "next/image";
import { FileDown, Github, Instagram, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const posts = await getInstagramPosts();
  return (
    <main className="flex flex-col items-center justify-center">
      <section className="w-full max-w-5xl mx-auto px-4 text-center items-center">
        <h1 className="sm:text-5xl text-4xl text-balance font-calistoga text-center">
          hi, deniz here.
        </h1>
        <h2 className="mt-2 whitespace-nowrap text-sm font-medium sm:text-base text-center inline-flex items-center justify-center gap-1">
          {getAge("2004-04-24")} yo software engineer from Portugal
          <Image
            src={portugalFlag}
            alt=""
            className="w-5 h-auto aspect-[1.5] object-contain rounded"
          />
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
      <section className="w-full max-w-5xl mx-auto px-4 md:grid flex flex-col-reverse grid-cols-5 gap-6 mt-6 items-center">
        <article className="col-span-3 flex flex-col items-start gap-6 w-full">
          <h1 className="sm:text-4xl text-3xl text-balance font-calistoga w-full text-center">
            about me
          </h1>
          <p className="sm:text-base text-sm">
            I&apos;m Deniz, a developer from Portugal with a background shaped
            heavily by competitive sports. Before diving into software, I spent
            years playing handball at a national level and later American
            football, representing Portugal internationally and even signing to
            play in Germany. Those experiences taught me discipline, focus, and
            how to handle pressure — qualities that now influence the way I
            approach engineering and problem-solving.
          </p>
          <p className="sm:text-base text-sm">
            Today, I&apos;m completing my degree in Computing and Informatics
            Engineering at FEUP while building real-world products as the
            co-founder and sole developer at Ocean Informatix. I work across the
            full stack, creating web applications, custom software, and modern
            digital experiences for clients. I enjoy designing systems
            end-to-end, experimenting with new technologies, and building
            products that feel simple, reliable, and meaningful to use.
          </p>
        </article>
        <div className="col-span-2 w-full flex flex-col items-center gap-2">
          <div className="rounded-t-full h-auto aspect-[0.8] bg-accent w-full overflow-hidden sm:max-w-2xs max-w-3xs border shadow flex flex-col items-center justify-end group">
            <Image
              src="/headshot-square.png"
              alt="Deniz profile picture"
              width={512}
              height={512}
              className="w-full h-auto aspect-square object-cover translate-y-2 group-hover:translate-y-0 transition-transform duration-300 drop-shadow-2xl"
            />
          </div>
          <div className="flex justify-center w-full sm:max-w-2xs max-w-3xs gap-2 items-center mx-auto">
            <Button variant={"secondary"} className="grow flex-1" asChild>
              <a href="/assets/DenizGunesCV2025.pdf" target="_blank">
                Resume <FileDown />
              </a>
            </Button>
            <div className="grow flex-1 flex items-center justify-between">
              <a
                href="https://www.linkedin.com/in/deniz-g%C3%BCnes-068509263/"
                className="text-accent hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/denizlg24"
                className="text-accent hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/denizlg24"
                className="text-accent hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:denizlg24@gmail.com"
                className="text-accent hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
