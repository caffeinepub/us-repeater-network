import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { Repeater, NewRepeater, UpdateRepeaterData, UserProfile } from "../backend";
import { Principal } from "@dfinity/principal";

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Repeaters ───────────────────────────────────────────────────────────────

export function useGetApprovedRepeaters() {
  const { actor, isFetching } = useActor();

  return useQuery<Repeater[]>({
    queryKey: ["approvedRepeaters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedRepeaters();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPendingRepeaters() {
  const { actor, isFetching } = useActor();

  return useQuery<Repeater[]>({
    queryKey: ["pendingRepeaters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingRepeaters();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetApprovedStates() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["approvedStates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedStates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetApprovedCitiesByState(state: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["approvedCities", state],
    queryFn: async () => {
      if (!actor || !state) return [];
      return actor.getApprovedCitiesByState(state);
    },
    enabled: !!actor && !isFetching && !!state,
  });
}

export function useGetRepeatersByCityAndState(state: string, city: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Repeater[]>({
    queryKey: ["repeatersByCityAndState", state, city],
    queryFn: async () => {
      if (!actor || !state || !city) return [];
      return actor.getRepeatersByCityAndState(state, city);
    },
    enabled: !!actor && !isFetching && !!state && !!city,
  });
}

export function useSearchByZipCode(zipCode: string, radius: number) {
  const { actor, isFetching } = useActor();

  return useQuery<Repeater[]>({
    queryKey: ["searchByZipCode", zipCode, radius],
    queryFn: async () => {
      if (!actor || !zipCode || radius === 0) return [];
      return actor.searchByZipCode(zipCode, BigInt(radius));
    },
    enabled: !!actor && !isFetching && !!zipCode && radius > 0,
  });
}

export function useAddRepeater() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewRepeater) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addRepeater(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvedRepeaters"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRepeaters"] });
    },
  });
}

export function useApproveRepeater() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      repeaterId,
      passphrase,
      approve,
    }: {
      repeaterId: bigint;
      passphrase: string;
      approve: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.approveRepeater(repeaterId, passphrase, approve);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvedRepeaters"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRepeaters"] });
    },
  });
}

export function useUpdateRepeater() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      repeaterId,
      passphrase,
      data,
    }: {
      repeaterId: bigint;
      passphrase: string;
      data: UpdateRepeaterData;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateRepeater(repeaterId, passphrase, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvedRepeaters"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRepeaters"] });
    },
  });
}

export function useDeleteRepeater() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      repeaterId,
      passphrase,
    }: {
      repeaterId: bigint;
      passphrase: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteRepeater(repeaterId, passphrase);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvedRepeaters"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRepeaters"] });
    },
  });
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export function useGetFavorites(userPrincipal: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Repeater[]>({
    queryKey: ["favorites", userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      return actor.getFavorites(Principal.fromText(userPrincipal));
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

export function useAddFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repeaterId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addFavorite(repeaterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useRemoveFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repeaterId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeFavorite(repeaterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
