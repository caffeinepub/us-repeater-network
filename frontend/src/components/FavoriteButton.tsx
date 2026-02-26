import React from "react";
import { Star } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetFavorites, useAddFavorite, useRemoveFavorite } from "../hooks/useQueries";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FavoriteButtonProps {
  repeaterId: bigint;
  disabled?: boolean;
  disabledReason?: string;
}

export default function FavoriteButton({
  repeaterId,
  disabled = false,
  disabledReason = "Favoriting is not available for this repeater",
}: FavoriteButtonProps) {
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString() ?? null;

  const { data: favorites = [] } = useGetFavorites(principalStr);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const isFavorited = favorites.some((f) => f.id === repeaterId);
  const isLoading = addFavorite.isPending || removeFavorite.isPending;

  const handleToggle = async () => {
    if (disabled || !identity) return;
    try {
      if (isFavorited) {
        await removeFavorite.mutateAsync(repeaterId);
        toast.success("Removed from favorites");
      } else {
        await addFavorite.mutateAsync(repeaterId);
        toast.success("Added to favorites");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update favorites");
    }
  };

  if (!identity) return null;

  const button = (
    <button
      onClick={handleToggle}
      disabled={disabled || isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
        disabled
          ? "opacity-40 cursor-not-allowed text-muted-foreground"
          : isFavorited
          ? "bg-amber text-navy hover:bg-amber-dark"
          : "border border-amber text-amber hover:bg-amber hover:text-navy"
      }`}
    >
      <Star
        className={`w-4 h-4 ${isFavorited && !disabled ? "fill-current" : ""}`}
      />
      {isLoading ? "..." : isFavorited ? "Favorited" : "Favorite"}
    </button>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
