import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Radio, Menu, X, Star, User, Shield, BookOpen } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: "/" });
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const navLinks = [
    { to: "/directory", label: "Directory", icon: <BookOpen className="w-4 h-4" /> },
    { to: "/submit", label: "Submit Repeater", icon: <Radio className="w-4 h-4" /> },
    { to: "/favorites", label: "Favorites", icon: <Star className="w-4 h-4" /> },
    { to: "/admin", label: "Admin", icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-navy border-b border-navy-light shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/assets/generated/antenna-tower-logo.dim_256x256.png"
                alt="US Repeater Network"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-amber tracking-wide font-display">
                US Repeater Network
              </span>
              <div className="text-xs text-muted-foreground tracking-widest uppercase">
                Ham Radio Directory
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium text-muted-foreground hover:text-amber hover:bg-navy-light transition-colors"
                activeProps={{ className: "text-amber bg-navy-light" }}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth + Mobile Toggle */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Link
                to="/profile"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium text-muted-foreground hover:text-amber hover:bg-navy-light transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
            )}
            <Button
              onClick={handleAuth}
              disabled={isLoggingIn}
              size="sm"
              variant={isAuthenticated ? "outline" : "default"}
              className={
                isAuthenticated
                  ? "border-amber text-amber hover:bg-amber hover:text-navy"
                  : "bg-amber text-navy hover:bg-amber-dark font-semibold"
              }
            >
              {isLoggingIn ? "Logging in..." : isAuthenticated ? "Logout" : "Login"}
            </Button>
            <button
              className="md:hidden p-2 rounded text-muted-foreground hover:text-amber"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy border-t border-navy-light px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-muted-foreground hover:text-amber hover:bg-navy-light transition-colors"
              activeProps={{ className: "text-amber bg-navy-light" }}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-muted-foreground hover:text-amber hover:bg-navy-light transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
