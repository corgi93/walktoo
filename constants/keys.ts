export const QUERY_KEYS = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  user: {
    me: ['user', 'me'] as const,
  },
  couple: {
    profile: ['couple', 'profile'] as const,
    stats: ['couple', 'stats'] as const,
  },
  diary: {
    list: ['diary'] as const,
    detail: (id: string) => ['diary', id] as const,
  },
  steps: {
    today: ['steps', 'today'] as const,
    partner: ['steps', 'partner'] as const,
  },
  notification: {
    list: ['notification'] as const,
    unreadCount: ['notification', 'unread'] as const,
  },
};
