import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Globe,
  Radio,
  Search,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import React from "react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-navy overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-dark opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-amber/10 border border-amber/30 rounded-full px-4 py-1.5 text-sm text-amber mb-6">
                <Zap className="w-3.5 h-3.5" />
                Live data from RepeaterBook.com
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground font-display leading-tight mb-6">
                US Repeater <span className="text-amber">Network</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mb-8">
                The most comprehensive ham radio repeater directory in the
                United States. Search live data from RepeaterBook.com and
                community-submitted GMRS repeaters.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="bg-amber text-navy hover:bg-amber-dark font-bold"
                >
                  <Link to="/directory">
                    <Search className="w-4 h-4 mr-2" />
                    Search Repeaters
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-amber text-amber hover:bg-amber hover:text-navy"
                >
                  <Link to="/submit">
                    <Radio className="w-4 h-4 mr-2" />
                    Submit GMRS Repeater
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-amber/20 rounded-full blur-3xl" />
                <img
                  src="/assets/generated/antenna-tower-logo.dim_256x256.png"
                  alt="Antenna Tower"
                  className="relative w-48 h-48 sm:w-64 sm:h-64 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground font-display mb-3">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find repeaters, save favorites, and contribute to the community
              directory.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Globe className="w-6 h-6 text-amber" />,
                title: "Live RepeaterBook Data",
                desc: "Real-time ham radio repeater data pulled directly from RepeaterBook.com for every US state.",
              },
              {
                icon: <Search className="w-6 h-6 text-amber" />,
                title: "Advanced Search",
                desc: "Filter by state, city, frequency, and mode. Find the perfect repeater for your needs.",
              },
              {
                icon: <Star className="w-6 h-6 text-amber" />,
                title: "Save Favorites",
                desc: "Bookmark your go-to repeaters for quick access. Requires a free account.",
              },
              {
                icon: <Users className="w-6 h-6 text-amber" />,
                title: "GMRS Community",
                desc: "Submit and discover GMRS repeaters not covered by RepeaterBook.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border rounded-lg p-6 hover:border-amber/50 transition-colors"
              >
                <div className="w-12 h-12 bg-amber/10 rounded-lg flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground font-display mb-4">
            Have a GMRS Repeater?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            RepeaterBook covers ham radio repeaters, but GMRS repeaters need
            community support. Submit your GMRS repeater to help others find it.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-amber text-navy hover:bg-amber-dark font-bold"
          >
            <Link to="/submit">
              <Radio className="w-4 h-4 mr-2" />
              Submit a GMRS Repeater
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
