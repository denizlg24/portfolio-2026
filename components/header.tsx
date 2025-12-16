"use client";

import { Contact, FolderGit2, Home, Notebook } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "home", icon: <Home className="w-4.5 h-4.5" /> },
  {
    href: "/projects",
    label: "projects",
    icon: <FolderGit2 className="w-4.5 h-4.5" />,
  },
  { href: "/blog", label: "blog", icon: <Notebook className="w-4.5 h-4.5" /> },
  {
    href: "/contact",
    label: "contact",
    icon: <Contact className="w-4.5 h-4.5" />,
  },
];

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "transition-all w-full fixed pt-4 top-0 left-1/2 -translate-x-1/2 max-w-5xl sm:px-4 px-2 z-45",
        isScrolled && "max-w-full px-0! pt-0!",
      )}
    >
      <div
        className={cn(
          "transition-all flex flex-row w-fit py-4 sm:px-8 px-4 bg-surface border drop-shadow rounded-full mx-auto",
          isScrolled &&
            "shadow w-full rounded-none mx-0 bg-background border-0 drop-shadow-none",
        )}
      >
        <nav className="w-full max-w-3xl mx-auto flex flex-row items-center justify-center sm:gap-6 gap-4 font-semibold sm:text-base text-sm">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === link.href
                : pathname.startsWith(link.href);
            const showUnderline = hoveredLink
              ? hoveredLink === link.href
              : isActive;

            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative group inline-flex justify-center gap-2 items-center"
                onMouseEnter={() => setHoveredLink(link.href)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {link.icon}
                <p>{link.label}</p>
                <span
                  className={cn(
                    "absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-foreground transition-all duration-300",
                    showUnderline ? "w-full" : "w-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
