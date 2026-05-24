# Notification Seeder

Seed realistic mock notifications for development and testing.

## Features

- **10 Notification Types**: All supported notification types with realistic data
- **Rich Content**: Multi-line bodies with context, avatars, and action items
- **Smart Timestamps**: Notifications distributed across time (today, yesterday, this week)
- **Read/Unread Mix**: Realistic mix of read and unread notifications
- **Workspace Scoped**: All notifications are tied to a workspace
- **Idempotent**: Won't duplicate if run multiple times

## Notification Types Included

| Type | Count | Description |
|------|-------|-------------|
| `task_assigned` | 2 | New tasks assigned to user |
| `task_due` | 3 | Task due soon, overdue, and weekly summary |
| `habit_reminder` | 2 | Daily and weekly habit reminders |
| `goal_milestone` | 2 | Goal progress and milestone achievements |
| `budget_alert` | 2 | Budget threshold and over-budget alerts |
| `project_mention` | 2 | Mentions in project comments/updates |
| `workspace_invitation` | 2 | New invitations and approved join requests |
| `comment_reply` | 2 | Replies and mentions in comments |
| `system` | 3 | Weekly summary, feature announcements, security alerts |

**Total:** 20 notifications per user

## Usage

### Seed Specific User

```bash
pnpm ts-node apps/api/tools/seeds/seed-notifications.ts \
  --user <userId> \
  --workspace <workspaceId>
```

### Clear All Notifications

```bash
pnpm ts-node apps/api/tools/seeds/seed-notifications.ts --clear
```

### Clear Specific User

Use the API or MongoDB directly:

```bash
# Via MongoDB shell
db.notifications.deleteMany({ userId: ObjectId("<userId>") })
```

## Example Output

```
🌱 Starting notification seeder...
✅ Seeded 22 notifications for user 507f1f77bcf86cd799439011
```

## Sample Notifications

### Task Assigned
```
Title: New task assigned to you
Body: You've been assigned to "Complete API documentation" by John Doe...
Data: {
  taskId: "...",
  taskName: "Complete API documentation",
  projectName: "Q1 Documentation Sprint",
  assignedBy: "John Doe",
  priority: "high",
  dueDate: "2026-04-02T17:00:00.000Z"
}
```

### Budget Alert
```
Title: Budget alert: 80% spent
Body: Your "Monthly Groceries" budget alert...
Data: {
  budgetId: "...",
  budgetName: "Monthly Groceries",
  budgetAmount: 500,
  spentAmount: 402.5,
  percentUsed: 80,
  isOverBudget: false
}
```

### Chat Message
```
Title: New message in #general
Body: Alex Thompson: "Hey team! Just a reminder..."
Data: {
  channelId: "...",
  channelName: "general",
  senderName: "Alex Thompson",
  unreadCount: 3
}
```

## Integration

### Use in Other Seeders

```typescript
import { NotificationSeeder } from '@/notifications/seeds/notification-seeder';

// In your main seeder
constructor(
  private notificationSeeder: NotificationSeeder,
) {}

async seed() {
  await this.notificationSeeder.seedForUser(userId, workspaceId);
}
```

### Use in Tests

```typescript
describe('Notifications E2E', () => {
  beforeAll(async () => {
    await notificationSeeder.seedForUser(testUserId, testWorkspaceId);
  });
  
  it('should list notifications', async () => {
    // Test with seeded data
  });
});
```

## Customization

### Add New Notification Types

Edit `apps/api/src/notifications/seeds/notification-seeder.ts`:

```typescript
private getMockNotifications(...) {
  return [
    // ... existing notifications
    
    // Add new type
    {
      type: NotificationType.YOUR_NEW_TYPE,
      title: 'Your notification title',
      body: 'Detailed notification body...',
      data: {
        // Custom data
      },
      isRead: false,
      daysAgo: 0,
    },
  ];
}
```

### Adjust Quantity

Modify the `getMockNotifications` array or add logic to randomize:

```typescript
// Randomize read state
isRead: Math.random() > 0.5,

// Randomize timing
daysAgo: Math.floor(Math.random() * 7), // 0-7 days ago
```

## Database TTL

Notifications have a 90-day TTL (Time To Live) index:

```typescript
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);
```

Old notifications are automatically deleted by MongoDB.

## Troubleshooting

### "Already has notifications" Error

The seeder checks for existing notifications and skips if any exist. To force re-seed:

```bash
pnpm ts-node apps/api/tools/seeds/seed-notifications.ts --clear
```

### Invalid ObjectId Error

Ensure you're using valid MongoDB ObjectId strings (24 hex characters):

```bash
# Valid
--user 507f1f77bcf86cd799439011

# Invalid
--user user123
```

### No Notifications Appearing

1. Check workspace ID matches your current workspace
2. Verify the user exists in the database
3. Check frontend is using correct workspace header (`x-workspace-id`)

## Files

```
apps/api/src/notifications/
├── seeds/
│   └── notification-seeder.ts      # Main seeder class
apps/api/tools/seeds/
└── seed-notifications.ts           # CLI entry point
```
