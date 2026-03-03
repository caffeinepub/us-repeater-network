import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export default function Footer() {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(window.location.hostname || 'ham-repeaters-ai');

  return (
    <footer className="bg-navy-900 border-t border-navy-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/assets/generated/antenna-tower-logo.dim_256x256.png"
                alt="US Repeater Network"
                className="w-8 h-8 object-contain"
              />
              <span className="font-display font-bold text-amber-400 text-lg">
                US Repeater Network
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your CHIRP radio memory manager and ham radio repeater directory, powered by the Internet Computer.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Home' },
                { to: '/directory', label: 'Repeater Directory' },
                { to: '/submit', label: 'Submit a Repeater' },
                { to: '/favorites', label: 'My Favorites' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-muted-foreground hover:text-amber-400 text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Data sources */}
          <div>
            <h3 className="text-foreground font-semibold mb-3 text-sm uppercase tracking-wider">
              Compatible With
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://chirpmyradio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors"
                >
                  CHIRP (chirpmyradio.com)
                </a>
              </li>
              <li className="text-muted-foreground/60">
                Standard CHIRP CSV export format
              </li>
              <li className="text-muted-foreground/60">
                Community-submitted local repeaters
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {year} US Repeater Network. All rights reserved.</span>
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
          >
            Built with <Heart className="w-3 h-3 fill-amber-500 text-amber-500" /> using caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
