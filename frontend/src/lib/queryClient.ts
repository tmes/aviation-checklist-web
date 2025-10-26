// TanStack Query Configuration
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Query Keys Factory
export const queryKeys = {
  // Auth
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },

  // Aircraft
  aircraft: {
    all: ['aircraft'] as const,
    list: (orgId?: string) => ['aircraft', 'list', { orgId }] as const,
    detail: (id: string) => ['aircraft', 'detail', id] as const,
  },

  // Checklists
  checklists: {
    all: ['checklists'] as const,
    list: (filters?: { aircraftId?: string; orgId?: string }) =>
      ['checklists', 'list', filters] as const,
    detail: (id: string) => ['checklists', 'detail', id] as const,
    items: (checklistId: string) => ['checklists', checklistId, 'items'] as const,
  },

  // Organizations
  organizations: {
    all: ['organizations'] as const,
    list: () => ['organizations', 'list'] as const,
    detail: (id: string) => ['organizations', 'detail', id] as const,
    members: (id: string) => ['organizations', id, 'members'] as const,
  },

  // Settings
  settings: {
    public: ['settings', 'public'] as const,
    all: ['settings', 'all'] as const,
  },

  // Subscriptions
  subscriptions: {
    current: ['subscriptions', 'current'] as const,
    plans: ['subscriptions', 'plans'] as const,
  },

  // Translations
  translations: {
    language: (lang: string) => ['translations', lang] as const,
  },
};
