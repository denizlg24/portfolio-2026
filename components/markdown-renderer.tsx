import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { StyledLink } from "./styled-link";

const MediumStyleComponents = {
  p: ({ node, ...props }: any) => (
    <p
      className=" text-[17px] sm:text-[19px] md:text-[21px] leading-[28px] sm:leading-[30px] md:leading-[32px] text-foreground/90 mb-[29px] tracking-[-0.003em] break-words"
      {...props}
    />
  ),

  h1: ({ node, ...props }: any) => (
    <h1
      className=" text-[32px] sm:text-[42px] md:text-[52px] font-bold text-foreground tracking-[-0.022em] leading-[1.1] mt-[42px] sm:mt-[48px] md:mt-[52px] mb-[8px]"
      {...props}
    />
  ),
  h2: ({ node, ...props }: any) => (
    <h2
      className=" text-[26px] sm:text-[32px] md:text-[40px] font-bold text-foreground tracking-[-0.022em] leading-[1.15] mt-[32px] sm:mt-[38px] md:mt-[42px] mb-[8px]"
      {...props}
    />
  ),
  h3: ({ node, ...props }: any) => (
    <h3
      className=" text-[22px] sm:text-[26px] md:text-[32px] font-bold text-foreground tracking-[-0.019em] leading-[1.2] mt-[26px] sm:text-[30px] md:mt-[32px] mb-[8px]"
      {...props}
    />
  ),
  h4: ({ node, ...props }: any) => (
    <h4
      className=" text-[19px] sm:text-[22px] md:text-[26px] font-bold text-foreground tracking-[-0.015em] leading-[1.22] mt-[20px] sm:mt-[22px] md:mt-[24px] mb-[8px]"
      {...props}
    />
  ),
  h5: ({ node, ...props }: any) => (
    <h5
      className=" text-[18px] sm:text-[19px] md:text-[20px] font-semibold text-foreground tracking-[-0.012em] leading-[1.25] mt-[18px] sm:mt-[19px] md:mt-[20px] mb-[8px]"
      {...props}
    />
  ),
  h6: ({ node, ...props }: any) => (
    <h6
      className=" text-[16px] sm:text-[17px] md:text-[18px] font-semibold text-foreground tracking-[-0.01em] leading-[1.3] mt-[14px] sm:mt-[15px] md:mt-[16px] mb-[8px]"
      {...props}
    />
  ),

  a: ({ node, children, ...props }: any) => {
    const hasImage = node.children?.some(
      (child: any) => child.type === "element" && child.tagName === "img",
    );

    if (hasImage) {
      return (
        <a
          {...props}
          className="inline-block hover:opacity-90 transition-opacity"
        >
          {children}
        </a>
      );
    }

    return (
      <StyledLink
        className=" underline decoration-1 underline-offset-2 hover:decoration-2"
        type="anchor"
        {...props}
      >
        {children}
      </StyledLink>
    );
  },

  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="border-l-[3px] border-foreground/80 pl-[23px] ml-0 mr-0 my-[29px] italic  text-[20px] sm:text-[22px] md:text-[24px] leading-[30px] sm:leading-[33px] md:leading-[36px] text-foreground/80"
      {...props}
    />
  ),

  ul: ({ node, ...props }: any) => (
    <ul
      className="list-disc list-outside ml-[30px] mb-[29px]  text-[17px] sm:text-[19px] md:text-[21px] leading-[28px] sm:leading-[30px] md:leading-[32px] text-foreground/90"
      {...props}
    />
  ),
  ol: ({ node, ...props }: any) => (
    <ol
      className="list-decimal list-outside ml-[30px] mb-[29px]  text-[17px] sm:text-[19px] md:text-[21px] leading-[28px] sm:leading-[30px] md:leading-[32px] text-foreground/90"
      {...props}
    />
  ),
  li: ({ node, ...props }: any) => (
    <li className="mb-[10px] pl-[5px]" {...props} />
  ),

  code: ({ node, inline, className, children, ...props }: any) => {
    if (!inline) {
      return (
        <code
          className={cn(
            "bg-muted/50 text-foreground px-[6px] py-[3px]",
            className,
          )}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-muted/50 text-foreground px-[6px] py-[3px] rounded-[3px] text-[16px] sm:text-[17px] md:text-[18px] font-mono border border-border/40"
        {...props}
      >
        {children}
      </code>
    );
  },

  pre: ({ node, ...props }: any) => (
    <pre
      className="bg-muted/30 border border-border/40 p-[20px] rounded-[4px] overflow-x-auto text-[14px] sm:text-[15px] md:text-[16px] leading-[22px] sm:leading-[23px] md:leading-[24px] my-[29px] font-mono"
      {...props}
    />
  ),

  img: ({ node, ...props }: any) => (
    <img
      className="w-full h-auto my-[42px] mx-auto rounded-[4px]"
      loading="lazy"
      {...props}
    />
  ),

  hr: ({ node, ...props }: any) => (
    <div className="flex items-center justify-center my-[42px] gap-[8px]">
      <span className="w-[6px] h-[6px] rounded-full bg-foreground/40" />
      <span className="w-[6px] h-[6px] rounded-full bg-foreground/40" />
      <span className="w-[6px] h-[6px] rounded-full bg-foreground/40" />
    </div>
  ),

  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-[29px]">
      <table
        className="min-w-full text-left text-[16px] sm:text-[17px] md:text-[18px] border-collapse"
        {...props}
      />
    </div>
  ),
  th: ({ node, ...props }: any) => (
    <th
      className=" font-semibold p-[10px] sm:p-[11px] md:p-[12px] border-b-[2px] border-border text-foreground"
      {...props}
    />
  ),
  td: ({ node, ...props }: any) => (
    <td
      className=" p-[10px] sm:p-[11px] md:p-[12px] border-b border-border/40 text-foreground/90"
      {...props}
    />
  ),

  strong: ({ node, ...props }: any) => (
    <strong className="font-bold text-foreground" {...props} />
  ),

  em: ({ node, ...props }: any) => <em className="italic" {...props} />,
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <article className={`w-full max-w-full mx-auto ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={MediumStyleComponents}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
