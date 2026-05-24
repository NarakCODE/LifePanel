# Dashboard Implementation Plan

## Context
The NestJS API already has a minimal `DashboardModule` with a single `GET /dashboard/tasks-overview` endpoint that returns task metrics via `TasksService.getTaskOverview()`. The goal is to expand this into a full dashboard controller with summary, activity, metrics, and overview endpoints that aggregate data from all relevant sub-services.

## Relevant Sub-Services
- **Tasks** — has `getTaskOverview()` aggregation (total, status counts, overdue, upcoming, completed summary)
- **Issues** — no summary method; needs lightweight counts
- **Goals** — no summary method; needs counts + progress
- **Habits** — no summary method; needs counts + streak info
- **Transactions** — has `getSummary()` (income/expense/net, by category/type)
- **Budgets** — has `getBudgetSummary()` (with spending vs budget)
- **Notifications** — has `getUnreadCount()`
- **Projects** — has `findAllAccessible()`
- **Notes** — no summary method; needs counts + recent
- **Journal Entries** — has `getMoodSummary()`

## Tasks

- [x] Add lightweight summary methods to sub-services/repositories where missing
  - IssuesRepository: `getIssueOverview()` — total, by status, overdue
  - GoalsRepository: `getGoalOverview()` — total, by status, avg progress
  - HabitsRepository: `getHabitOverview()` — total, active, best streak, avg streak
  - NotesRepository: `getNoteOverview()` — total, by status
  - ProjectsRepository: `getProjectOverview()` — total, by status

- [x] Create DashboardService
  - Orchestrates calls to all sub-services using `Promise.all` where independent
  - Composes clean dashboard response objects
  - Handles empty/safe defaults
  - Accepts optional date range filters

- [x] Create Dashboard DTOs
  - `DashboardQueryDto`
  - `DashboardSummaryResponseDto`
  - `DashboardActivityResponseDto`
  - `DashboardMetricsResponseDto`
  - `DashboardOverviewResponseDto`

- [x] Expand DashboardController
  - `GET /dashboard/summary`
  - `GET /dashboard/activity`
  - `GET /dashboard/metrics`
  - `GET /dashboard/overview`
  - Keep existing `GET /dashboard/tasks-overview`
  - Apply auth/guard/decorator patterns consistently

- [x] Update DashboardModule imports
  - Import all modules whose services are needed

- [x] Add tests
  - `dashboard.service.spec.ts`
  - `dashboard.controller.spec.ts`

- [x] Run checks
  - `npm run check-types` — passed
  - `npm run lint` — passed (only pre-existing warnings/errors in unrelated files)
  - `npx jest src/dashboard/` — 10 tests passed

## Design Decisions
- Use existing service methods where possible; only add missing lightweight aggregations
- Keep aggregation logic in DashboardService, controllers thin
- Return consistent zero/empty defaults when no data exists
- Use `WorkspacePermission.WORKSPACE_READ` for dashboard read endpoints (available to all roles)
- Support `dateFrom`/`dateTo` query params for time-bounded activity/metrics
