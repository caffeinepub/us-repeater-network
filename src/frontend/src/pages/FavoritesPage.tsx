import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Radio, Star } from "lucide-react";
import React, { useState } from "react";
import type { Repeater } from "../backend";
import RepeaterCard from "../components/RepeaterCard";
import RepeaterDetailModal from "../components/RepeaterDetailModal";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddFavorite,
  useGetFavorites,
  useRemoveFavorite,
} from "../hooks/useQueries";

export default function FavoritesPage() {
  const { identity, login } = useInternetIdentity();
  // Convert null → undefined to match useGetFavorites(string | undefined) signature
  const userPrincipal = identity?.getPrincipal().toString() ?? undefined;

  const [selectedRepeater, setSelectedRepeater] = useState<Repeater | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  const { data: favorites, isLoading } = useGetFavorites(userPrincipal);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const favoriteIds = new Set((favorites ?? []).map((r) => r.id.toString()));

  const handleFavoriteToggle = (id: bigint, isFav: boolean) => {
    if (!userPrincipal) return;
    if (isFav) {
      removeFavorite.mutate(id);
    } else {
      addFavorite.mutate(id);
    }
  };

  const handleCardClick = (repeater: Repeater) => {
    setSelectedRepeater(repeater);
    setModalOpen(true);
  };

  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Star className="w-16 h-16 text-amber-500 mx-auto mb-4 opacity-50" />
        <h1 className="text-2xl font-bold text-foreground font-display mb-3">
          Login Required
        </h1>
        <p className="text-muted-foreground mb-6">
          You need to be logged in to view your favorite repeaters.
        </p>
        <Button onClick={login} className="font-bold">
          Login to View Favorites
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-display font-bold text-foreground">
              My Favorites
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-9">
            Your saved repeaters for quick access.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
              <Skeleton key={k} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : !favorites || favorites.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-16 h-16 text-amber-500/30 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              No Favorites Yet
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Browse the directory and star repeaters to save them here.
            </p>
            <Link to="/directory">
              <Button className="font-semibold gap-2">
                <Radio className="w-4 h-4" />
                Browse Directory
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((r) => (
              <RepeaterCard
                key={r.id.toString()}
                repeater={r}
                onClick={() => handleCardClick(r)}
                isFavorite={favoriteIds.has(r.id.toString())}
                onFavoriteToggle={handleFavoriteToggle}
                favoritesDisabled={false}
              />
            ))}
          </div>
        )}
      </div>

      <RepeaterDetailModal
        repeater={selectedRepeater}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRepeater(null);
        }}
      />
    </main>
  );
}
