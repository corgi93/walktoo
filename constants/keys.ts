export const QUERY_KEYS = {
  user: {
    me: ['user', 'me'] as const,
  },
  couple: {
    profile: ['couple', 'profile'] as const,
  },
  diary: {
    list: ['diary'] as const,
    detail: (id: string) => ['diary', id] as const,
  },
};
