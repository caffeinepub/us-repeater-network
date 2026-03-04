import { Principal } from "@dfinity/principal";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  NewRepeater,
  Repeater,
  UpdateRepeaterData,
  UserProfile,
  UserRole,
} from "../backend";
import { useActor } from "./useActor";

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
    staleTime: 1000 * 60 * 2, // 2 minutes
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

export function useAddRepeater() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewRepeater) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addRepeater(data);
    },
    onSuccess: () => {
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
      approve,
    }: { repeaterId: bigint; approve: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.approveRepeater(repeaterId, approve);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRepeaters"] });
      queryClient.invalidateQueries({ queryKey: ["approvedRepeaters"] });
    },
  });
}

export function useDeleteRepeater() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repeaterId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteRepeater(repeaterId);
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
      data,
    }: { repeaterId: bigint; data: UpdateRepeaterData }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateRepeater(repeaterId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvedRepeaters"] });
    },
  });
}

export function useBulkAddRepeaters() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repeaters: Repeater[]) => {
      if (!actor) throw new Error("Actor not available");
      return actor.bulkAddRepeaters(repeaters);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvedRepeaters"] });
    },
  });
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export function useGetFavorites(userPrincipal: string | undefined) {
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

// ─── User Profile ─────────────────────────────────────────────────────────────

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

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useRegisterAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (passphrase: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.registerAdmin(passphrase);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

export function useIsAdminPassphraseValid() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (passphrase: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.isAdminPassphraseValid(passphrase);
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerUserRole"] });
    },
  });
}

// ─── States (static — no longer fetched from backend) ────────────────────────

/** @deprecated Use the static US_STATES list in FilterBar instead */
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
