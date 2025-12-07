import { Linkedin, Github, Instagram, Mail } from "lucide-react";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="w-full border-t py-8 mt-12">
      <div className="w-full mx-auto max-w-5xl flex xs:flex-row flex-col items-center justify-between gap-2 px-4 text-foreground fo">
        <div className="inline-flex items-center gap-1">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} denizlg24.com
          </p>
          <div className="w-px h-4 bg-foreground"/>
          <Link href="/privacy-policy" className="text-sm font-medium hover:text-accent hover:font-bold transition-all">
            privacy?
          </Link>
        </div>
        <div className="w-full max-w-[150px] gap-2 flex flex-row justify-evenly items-center">
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
    </footer>
  );
};
