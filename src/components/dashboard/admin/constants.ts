export const defaultWorkspaceFeatures = {
  chat: true,
  files: true,
  kanban: true,
  crm: true,
  analytics: true,
  announcements: true,
  support: true,
} as const;

export type WorkspaceFeatureKey = keyof typeof defaultWorkspaceFeatures;

export type WorkspaceFeatureMap = Record<WorkspaceFeatureKey, boolean>;

export type WorkspaceFeatureDefinition = {
  key: WorkspaceFeatureKey;
  label: string;
  description: string;
};

export const workspaceFeatureDefinitions: Array<WorkspaceFeatureDefinition> = [
  {
    key: "chat",
    label: "Chat",
    description: "Enable secure, real-time communication for teams.",
  },
  {
    key: "files",
    label: "File Library",
    description: "Allow uploading and organizing shared assets.",
  },
  {
    key: "kanban",
    label: "Kanban Boards",
    description: "Unlock agile task tracking with drag-and-drop boards.",
  },
  {
    key: "crm",
    label: "CRM Pipeline",
    description: "Manage leads and deals with pipeline tooling.",
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Surface dashboards and reporting widgets.",
  },
  {
    key: "announcements",
    label: "Announcements",
    description: "Broadcast company-wide updates and alerts.",
  },
  {
    key: "support",
    label: "Support Desk",
    description: "Handle tickets and customer support requests.",
  },
];
