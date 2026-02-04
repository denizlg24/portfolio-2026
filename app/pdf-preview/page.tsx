import { MarkdownRenderer } from "@/components/markdown-renderer";
import Image from "next/image";
import logo from "@/public/assets/logos/logo_rounded.png";
import { Separator } from "@/components/ui/separator";
export default async function AdminNotesPdfPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const {
    content: contentParam,
    title: contentTitle,
    showHeader,
  } = await searchParams;
  const content = decodeURIComponent(contentParam || "");
  const title = decodeURIComponent(contentTitle || "");
  return (
    <div className="w-full flex flex-col items-center -mt-26">
      {showHeader && (
        <>
          <div className="w-full max-w-7xl flex flex-row justify-between items-center gap-2">
            <Image src={logo} alt="Logo" width={64} height={64} />
            <p className="text-sm font-bold">{title}</p>
            <p className="text-sm pr-3">{new Date().toLocaleDateString()}</p>
          </div>
          <Separator className="my-1 w-full" />
        </>
      )}
      <div className="w-full max-w-full! mx-auto bg-background p-6">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
