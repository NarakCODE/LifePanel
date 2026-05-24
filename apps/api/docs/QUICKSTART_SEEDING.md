# Quick Start: Seed Notifications

## Prerequisites

1. MongoDB must be running
2. API server dependencies installed
3. You need a valid user ID and workspace ID

## Find Your User and Workspace IDs

### Option 1: Via MongoDB Shell

```bash
mongosh

# Switch to your database
use life-dashboard

# List users
db.users.find({}, { email: 1, displayName: 1, _id: 1 })

# List workspaces
db.workspaces.find({}, { name: 1, _id: 1 })
```

### Option 2: Via API

```bash
# Get current user (includes IDs)
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Option 3: Check Application Logs

When you log in, check the API logs for user/workspace IDs in the JWT token or database queries.

## Seed Notifications

### Basic Usage

```bash
cd apps/api

# Seed notifications for a specific user
pnpm seed:notifications \
  --user 507f1f77bcf86cd799439011 \
  --workspace 507f191e810c19729de860ea
```

### Clear All Notifications

```bash
pnpm seed:notifications:clear
```

## Verify in Frontend

1. Start the frontend: `pnpm dev` (from `apps/project-dashboard`)
2. Log in as the seeded user
3. Navigate to `/inbox` or click the bell icon
4. You should see 22 realistic notifications

## What Gets Seeded

Each user receives 22 notifications across all types:

- ✅ 2 Task assignments
- ✅ 3 Task due reminders  
- ✅ 2 Habit reminders
- ✅ 2 Goal milestones
- ✅ 2 Budget alerts
- ✅ 2 Project mentions
- ✅ 2 Chat messages
- ✅ 2 Workspace invitations
- ✅ 2 Comment replies
- ✅ 3 System notifications

## Common Issues

### "Cannot find module '@/notifications/...'"

Make sure you're running from the `apps/api` directory or update tsconfig paths.

### "Invalid ObjectId"

ObjectId must be 24 hexadecimal characters:
```bash
# ✅ Valid
--user 507f1f77bcf86cd799439011

# ❌ Invalid
--user user123
--user 12345
```

### "Already has notifications"

The seeder is idempotent. Clear first if you want to re-seed:
```bash
pnpm seed:notifications:clear
pnpm seed:notifications --user ... --workspace ...
```

### Notifications Not Appearing in UI

1. Check you're using the correct workspace ID
2. Verify the frontend is sending `x-workspace-id` header
3. Check browser console for API errors
4. Ensure notifications aren't filtered out

## Development Workflow

### Daily Development

```bash
# Start API
cd apps/api && pnpm dev

# In another terminal, seed notifications
cd apps/api && pnpm seed:notifications --user YOUR_USER_ID --workspace YOUR_WORKSPACE_ID

# Start frontend
cd apps/project-dashboard && pnpm dev
```

### Testing New Notification Types

1. Add new type to `NotificationType` enum
2. Add mock data in `notification-seeder.ts`
3. Clear and re-seed:
   ```bash
   pnpm seed:notifications:clear
   pnpm seed:notifications --user ... --workspace ...
   ```
4. Test in UI

## Next Steps

- [ ] Integrate seeder into main database seeder
- [ ] Add notification preferences/subscription system
- [ ] Create admin UI for sending test notifications
- [ ] Add notification templates for common scenarios
