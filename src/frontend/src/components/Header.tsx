import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Home,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  Star,
  Upload,
  User,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    { to: "/", label: "Home", icon: Home },
    { to: "/directory", label: "Directory", icon: BookOpen },
    { to: "/submit", label: "Submit", icon: Upload },
    ...(isAuthenticated
      ? [{ to: "/favorites", label: "Favorites", icon: Star }]
      : []),
    ...(isAuthenticated
      ? [{ to: "/profile", label: "Profile", icon: User }]
      : []),
    { to: "/admin", label: "Import CSV", icon: Upload },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/assets/generated/antenna-tower-logo.dim_256x256.png"
              alt="US Repeater Network"
              className="w-8 h-8 object-contain"
            />
            <span className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors hidden sm:block">
              US Repeater Network
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to + label}
                to={to}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                activeProps={{ className: "text-primary bg-primary/10" }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAuth}
              disabled={isLoggingIn}
              variant={isAuthenticated ? "outline" : "default"}
              size="sm"
              className="hidden sm:flex items-center gap-1.5"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isAuthenticated ? (
                <LogOut className="w-4 h-4" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isLoggingIn
                ? "Logging in..."
                : isAuthenticated
                  ? "Logout"
                  : "Login"}
            </Button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to + label}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                activeProps={{ className: "text-primary bg-primary/10" }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border">
              <Button
                onClick={() => {
                  handleAuth();
                  setMobileOpen(false);
                }}
                disabled={isLoggingIn}
                variant={isAuthenticated ? "outline" : "default"}
                size="sm"
                className="w-full"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : isAuthenticated ? (
                  <LogOut className="w-4 h-4 mr-2" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                {isLoggingIn
                  ? "Logging in..."
                  : isAuthenticated
                    ? "Logout"
                    : "Login"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
