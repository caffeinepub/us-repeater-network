import React from "react";
import { Link } from "@tanstack/react-router";
import { Radio, Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "us-repeater-network"
  );

  return (
    <footer className="bg-navy border-t border-navy-light mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-5 h-5 text-amber" />
              <span className="font-bold text-amber font-display">US Repeater Network</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The premier directory for ham radio repeaters across the United States. Live data
              powered by RepeaterBook.com.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/directory" className="hover:text-amber transition-colors">
                  Repeater Directory
                </Link>
              </li>
              <li>
                <Link to="/submit" className="hover:text-amber transition-colors">
                  Submit a Repeater
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-amber transition-colors">
                  My Favorites
                </Link>
              </li>
              <li>
                <a
                  href="https://www.repeaterbook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber transition-colors"
                >
                  RepeaterBook.com ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Data Sources */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              Data Sources
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://www.repeaterbook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber transition-colors"
                >
                  RepeaterBook.com — Ham Radio
                </a>
              </li>
              <li>
                <Link to="/submit" className="hover:text-amber transition-colors">
                  Community Submissions — GMRS
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-navy-light flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© {year} US Repeater Network. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Built with{" "}
            <Heart className="w-3.5 h-3.5 text-amber fill-amber mx-0.5" /> using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber hover:underline"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
