import React, { useState } from "react";
import { Star, Radio, LogIn } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetFavorites } from "../hooks/useQueries";
import type { Repeater } from "../backend";
import RepeaterCard, { type DisplayRepeater } from "../components/RepeaterCard";
import RepeaterDetailModal from "../components/RepeaterDetailModal";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export default function FavoritesPage() {
  const { identity, login } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() ?? null;
  const { data: favorites = [], isLoading } = useGetFavorites(principalStr);
  const [selectedRepeater, setSelectedRepeater] = useState<DisplayRepeater | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Star className="w-16 h-16 text-amber mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground font-display mb-3">My Favorites</h1>
        <p className="text-muted-foreground mb-6">
          Log in to save and view your favorite repeaters.
        </p>
        <Button onClick={login} className="bg-amber text-navy hover:bg-amber-dark font-bold">
          <LogIn className="w-4 h-4 mr-2" />
          Login
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground font-display mb-2 flex items-center gap-3">
          <Star className="w-7 h-7 text-amber fill-amber" />
          My Favorites
        </h1>
        <p className="text-muted-foreground">Your saved local repeaters.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Radio className="w-8 h-8 text-amber animate-pulse" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <Star className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">No favorites yet</p>
          <p className="text-muted-foreground text-sm mb-6">
            Browse the directory and click the star on local repeaters to save them here.
          </p>
          <Button asChild className="bg-amber text-navy hover:bg-amber-dark font-bold">
            <Link to="/directory">Browse Directory</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {favorites.map((r) => (
            <RepeaterCard
              key={r.id.toString()}
              repeater={r}
              onClick={(rep) => {
                setSelectedRepeater(rep);
                setModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <RepeaterDetailModal
        repeater={selectedRepeater}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
