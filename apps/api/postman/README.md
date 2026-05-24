# Postman Collections for Life Dashboard API

This directory contains the Postman collections and local environment for the migrated workspace-first API.

## Structure

```
postman/
├── collections/
│   ├── 01-auth.json
│   ├── 02-tasks.json
│   ├── 03-habits.json
│   ├── 04-habit-logs.json
│   ├── 05-goals.json
│   ├── 06-budgets.json
│   ├── 07-transactions.json
│   ├── 08-journal-entries.json
│   ├── 09-notifications.json
│   ├── 10-dashboard.json
│   ├── 11-workspaces.json
│   ├── 12-projects.json
│   ├── 13-issues.json
│   └── ...
├── environments/
│   └── life-dashboard-local.json
└── README.md
```

## Workspace model

All business-domain collections are now workspace-scoped. In practice, run requests with a populated `{{workspaceId}}` so the API resolves the correct workspace deterministically.

Collections that require `x-workspace-id` in their requests:
- `02-tasks`
- `03-habits`
- `04-habit-logs`
- `05-goals`
- `06-budgets`
- `07-transactions`
- `08-journal-entries`
- `09-notifications`
- `10-dashboard`
- `12-projects`
- `13-issues`

The `11-workspaces` collection uses `:workspaceId` path params for scoped routes, so an explicit workspace header is usually unnecessary there.

## Suggested flow

1. Import all files from `collections/` and the environment from `environments/life-dashboard-local.json`.
2. Run `01-auth -> Login`.
3. Run `01-auth -> Get Me` to save `userId` and `workspaceId`.
4. Run `12-projects -> Create Project` or `List Projects` to populate `projectId` and `workstreamId`.
5. Run `13-issues -> Create Issue` to populate `issueId` for update/delete examples.
6. Use the remaining business collections with the saved `workspaceId`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `baseUrl` | API base URL |
| `accessToken` | Access JWT |
| `refreshToken` | Refresh JWT |
| `userId` | Current authenticated user |
| `workspaceId` | Active workspace for all workspace-scoped collections |
| `invitationId` | Workspace invitation id |
| `memberId` | Workspace member id for removal examples |
| `projectId` | Project id for project/task examples |
| `workstreamId` | Workstream id for task examples |
| `taskId`, `habitId`, `habitLogId`, `goalId`, `budgetId`, `transactionId`, `journalEntryId`, `notificationId`, `issueId` | Saved ids from create requests |

## Notes

- `01-auth -> Get Me` now persists `workspaceId` from `activeWorkspaceId ?? defaultWorkspaceId`.
- `02-tasks` includes a helper request that reads `/projects` so task examples can use real project/workstream ids.
- `05-goals` uses the migrated routes: `/link-tasks`, `/unlink-task/:taskId`, `/link-habits`, `/unlink-habit/:habitId`, and `/log-progress`.
- `06-budgets -> Get Budget Summary` now uses `period`, `category`, and `isActive` filters instead of the older date-range example.
