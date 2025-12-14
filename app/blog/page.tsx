import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";
import { FilterWrapper } from "../projects/components/filter-wrapper";
import { BlogSection } from "./components/blog-section";
import { Select, SelectTrigger } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: {
    absolute: "Blog | Deniz Lopes Güneş",
  },
  description:
    "Thoughts, tutorials and essays about software engineering, full-stack development, open source, and career insights by Deniz Lopes Güneş.",
  openGraph: {
    title: "Blog | Deniz Lopes Güneş",
    description:
      "Thoughts, tutorials and essays about software engineering, full-stack development, open source, and career insights by Deniz Lopes Güneş.",
    url: "https://denizlg24.com/blog",
    siteName: "Deniz Lopes Güneş",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Deniz Lopes Güneş",
    description:
      "Thoughts, tutorials and essays about software engineering, full-stack development, open source, and career insights by Deniz Lopes Güneş.",
  },
};

export default async function Page() {
  return (
    <main className="flex flex-col items-center min-h-screen">
      <section className="w-full max-w-5xl mx-auto px-4 text-center items-center">
        <h1 className="sm:text-5xl text-4xl text-balance font-calistoga text-center">
          blog.
        </h1>
        <Suspense
          fallback={
            <div className="w-full flex xs:flex-row flex-col items-center justify-between mt-16 gap-2">
              <Input
                placeholder="Search projects..."
                className="w-full grow max-w-sm"
              />
              <Button
                variant="outline"
                className="xs:w-[200px] w-full justify-between"
              >
                Filter by topic...
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </div>
          }
        >
          <FilterWrapper fetcher="blog" />
        </Suspense>
        <div className="grid md:grid-cols-3 xs:grid-cols-2 grid-cols-1 gap-4 mt-4 pt-4 border-t">
          <Suspense
            fallback={
              <div className="w-fit h-[150px] flex items-center justify-center mx-auto col-span-full">
                <Loader2 className="animate-spin" />
              </div>
            }
          >
            <BlogSection initialBlogs={[]} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
