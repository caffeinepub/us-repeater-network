import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Star } from "lucide-react";
import type React from "react";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent) => void;
  pending?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export default function FavoriteButton({
  isFavorite,
  onClick,
  pending,
  disabled,
  disabledReason,
}: FavoriteButtonProps) {
  const button = (
    <Button
      variant="ghost"
      size="icon"
      className={`h-7 w-7 transition-colors ${
        disabled
          ? "opacity-30 cursor-not-allowed"
          : isFavorite
            ? "text-amber-400 hover:text-amber-300"
            : "text-muted-foreground hover:text-amber-400"
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={pending || disabled}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-400" : ""}`} />
    </Button>
  );

  if (disabled && disabledReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent className="bg-navy-800 border-navy-600 text-foreground text-xs max-w-[200px]">
            {disabledReason}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
