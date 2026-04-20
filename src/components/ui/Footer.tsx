import React from "react";
import { Github, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-4 text-center border-t border-white/5 bg-black/20 backdrop-blur-sm relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        <div className="flex items-center gap-8">
          <a
            href="https://jakubbarszczak.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted hover:text-accent transition-colors duration-300 group"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Portfolio</span>
          </a>
          <a
            href="https://github.com/jkbx1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted hover:text-accent transition-colors duration-300 group"
          >
            <Github className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">GitHub</span>
          </a>
        </div>
        <p className="text-muted/50 text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase">
          &copy; {new Date().getFullYear()} Lumina Finance. The future is bright.
        </p>
      </div>
    </footer>
  );
};
