import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Repeater, NewRepeater, UpdateRepeaterData, UserProfile } from '../backend';

const PAGE_SIZE = 50;

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
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
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useRegisterAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (passphrase: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerAdmin(passphrase);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

export function useGetApprovedRepeaters() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Repeater[]>({
    queryKey: ['approvedRepeaters'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedRepeaters();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useInfiniteApprovedRepeaters() {
  const { actor, isFetching: actorFetching } = useActor();

  return useInfiniteQuery<Repeater[], Error, { pages: Repeater[][] }, string[], number>({
    queryKey: ['approvedRepeatersInfinite'],
    queryFn: async ({ pageParam = 0 }) => {
      if (!actor) return [];
      const all = await actor.getApprovedRepeaters();
      const start = (pageParam as number) * PAGE_SIZE;
      return all.slice(start, start + PAGE_SIZE);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPendingRepeaters() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Repeater[]>({
    queryKey: ['pendingRepeaters'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingRepeaters();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddRepeater() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewRepeater) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addRepeater(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvedRepeaters'] });
      queryClient.invalidateQueries({ queryKey: ['approvedRepeatersInfinite'] });
      queryClient.invalidateQueries({ queryKey: ['pendingRepeaters'] });
    },
  });
}

export function useBulkAddRepeaters() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repeaters: Repeater[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bulkAddRepeaters(repeaters);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvedRepeaters'] });
      queryClient.invalidateQueries({ queryKey: ['approvedRepeatersInfinite'] });
      queryClient.invalidateQueries({ queryKey: ['pendingRepeaters'] });
    },
  });
}

export function useApproveRepeater() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ repeaterId, approve }: { repeaterId: bigint; approve: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveRepeater(repeaterId, approve);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvedRepeaters'] });
      queryClient.invalidateQueries({ queryKey: ['approvedRepeatersInfinite'] });
      queryClient.invalidateQueries({ queryKey: ['pendingRepeaters'] });
    },
  });
}

export function useUpdateRepeater() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ repeaterId, data }: { repeaterId: bigint; data: UpdateRepeaterData }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateRepeater(repeaterId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvedRepeaters'] });
      queryClient.invalidateQueries({ queryKey: ['approvedRepeatersInfinite'] });
    },
  });
}

export function useDeleteRepeater() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repeaterId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteRepeater(repeaterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvedRepeaters'] });
      queryClient.invalidateQueries({ queryKey: ['approvedRepeatersInfinite'] });
      queryClient.invalidateQueries({ queryKey: ['pendingRepeaters'] });
    },
  });
}

export function useGetFavorites(userPrincipal: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Repeater[]>({
    queryKey: ['favorites', userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      const { Principal } = await import('@dfinity/principal');
      return actor.getFavorites(Principal.fromText(userPrincipal));
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

export function useAddFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repeaterId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFavorite(repeaterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useRemoveFavorite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repeaterId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeFavorite(repeaterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useGetApprovedStates() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['approvedStates'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedStates();
    },
    enabled: !!actor && !actorFetching,
  });
}
