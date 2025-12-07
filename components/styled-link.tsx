import { cn } from "@/lib/utils";
import Link from "next/link";

type StyledLinkProps = React.ComponentProps<"a"> & {
  href: string;
  type?: "link" | "anchor";
  children: React.ReactNode | undefined;
  className?: string;
};

export const StyledLink = ({
  type = "link",
  className,
  children,
  ...props
}: StyledLinkProps) => {
  if (type === "link") {
    return (
      <Link {...props} className={cn("relative group", className)}>
        {children}
        <span className="w-full absolute -bottom-px left-1/2 -translate-x-1/2 h-0.5 duration-300 group-hover:w-0 transition-all bg-foreground" />
      </Link>
    );
  }
  if (type === "anchor") {
    return (
      <a {...props} className={cn("relative group", className)}>
        {children}
        <span className="w-full absolute -bottom-px left-1/2 -translate-x-1/2 h-0.5 duration-300 group-hover:w-0 transition-all bg-foreground" />
      </a>
    );
  }
  throw new Error("StyledLink: Invalid type");
};
