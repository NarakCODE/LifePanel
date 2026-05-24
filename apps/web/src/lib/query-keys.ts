const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

const projectsKeys = {
  all: ["projects"] as const,
  lists: () => [...projectsKeys.all, "list"] as const,
  list: (filters: Record<string, string | number | boolean | undefined>) => [...projectsKeys.lists(), filters] as const,
  details: () => [...projectsKeys.all, "detail"] as const,
  detail: (id: string) => [...projectsKeys.details(), id] as const,
};

const issuesKeys = {
  all: ["issues"] as const,
  lists: () => [...issuesKeys.all, "list"] as const,
  list: (filters: Record<string, string | number | boolean | undefined>) => [...issuesKeys.lists(), filters] as const,
  details: () => [...issuesKeys.all, "detail"] as const,
  detail: (id: string) => [...issuesKeys.details(), id] as const,
};

const notificationsKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationsKeys.all, "list"] as const,
  list: (filters: Record<string, string | number | boolean | undefined>) =>
    [...notificationsKeys.lists(), filters] as const,
};

const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
};

const workspacesKeys = {
  all: ["workspaces"] as const,
  lists: () => ["workspaces", "list"] as const,
  details: () => ["workspaces", "detail"] as const,
  detail: (id: string) => ["workspaces", "detail", id] as const,
  members: (workspaceId: string) => ["workspaces", "detail", workspaceId, "members"] as const,
  context: () => ["workspaces", "context"] as const,
  invitations: {
    all: ["workspaces", "invitations"] as const,
    mine: () => ["workspaces", "invitations", "mine"] as const,
    workspace: (workspaceId: string) => ["workspaces", "invitations", "workspace", workspaceId] as const,
  },
  joinLinks: {
    all: ["workspaces", "join-links"] as const,
    workspace: (workspaceId: string) => ["workspaces", "join-links", workspaceId] as const,
  },
  joinRequests: {
    all: ["workspaces", "join-requests"] as const,
    workspace: (workspaceId: string) => ["workspaces", "join-requests", workspaceId] as const,
  },
  joinToken: (token: string) => ["workspaces", "join", token] as const,
};

export { authKeys, dashboardKeys, issuesKeys, notificationsKeys, projectsKeys, workspacesKeys };
