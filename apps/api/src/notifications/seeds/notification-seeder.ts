import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from '../schemas/notification.schema';

interface SeedNotification {
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  daysAgo: number;
}

@Injectable()
export class NotificationSeeder {
  private readonly logger = new Logger(NotificationSeeder.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
  ) {}

  /**
   * Generate realistic mock notifications for all types
   */
  private getMockNotifications(
    userId: Types.ObjectId,
    workspaceId: Types.ObjectId,
  ): SeedNotification[] {
    const now = new Date();

    return [
      // TASK_ASSIGNED notifications
      {
        type: NotificationType.TASK_ASSIGNED,
        title: 'New task assigned to you',
        body: `You've been assigned to "Complete API documentation" by John Doe. This task is part of the Q1 Documentation Sprint and needs to be completed by end of week.

- Priority: High
- Due Date: Friday, 5 PM
- Estimated time: 8 hours

Please review the task details and reach out if you have any questions.`,
        data: {
          taskId: new Types.ObjectId().toString(),
          taskName: 'Complete API documentation',
          projectName: 'Q1 Documentation Sprint',
          assignedBy: 'John Doe',
          assignedByAvatar: 'https://api.dicebear.com/7.x/avataaars?seed=john',
          priority: 'high',
          dueDate: new Date(
            now.getTime() + 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          href: '/tasks/task-123',
        },
        isRead: false,
        daysAgo: 0, // Today
      },
      {
        type: NotificationType.TASK_ASSIGNED,
        title: 'Task assignment: Review PR #42',
        body: `Sarah Chen assigned you to review pull request #42.

- Repository: life-dashboard
- Branch: feature/auth-improvements
- Changes: 12 files, +234 -56

Your review is needed before this can be merged.`,
        data: {
          taskId: new Types.ObjectId().toString(),
          taskName: 'Review PR #42',
          projectName: 'Platform Improvements',
          assignedBy: 'Sarah Chen',
          assignedByAvatar: 'https://api.dicebear.com/7.x/avataaars?seed=sarah',
          priority: 'medium',
          href: '/tasks/task-124',
        },
        isRead: true,
        daysAgo: 2,
      },

      // TASK_DUE notifications
      {
        type: NotificationType.TASK_DUE,
        title: 'Task due in 2 hours',
        body: `Reminder: "Submit weekly report" is due soon.

- Due: Today at 5:00 PM
- Status: In Progress
- Time remaining: ~2 hours

Don't forget to submit your report before the deadline!`,
        data: {
          taskId: new Types.ObjectId().toString(),
          taskName: 'Submit weekly report',
          projectName: 'Weekly Operations',
          dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'in-progress',
          href: '/tasks/task-125',
        },
        isRead: false,
        daysAgo: 0,
      },
      {
        type: NotificationType.TASK_DUE,
        title: 'Task overdue: Design review',
        body: `The following task is now overdue:

- Task: Design review for new dashboard
- Was due: Yesterday
- Assignee: You
- Project: Dashboard Redesign

Please complete this task as soon as possible or update the due date if needed.`,
        data: {
          taskId: new Types.ObjectId().toString(),
          taskName: 'Design review for new dashboard',
          projectName: 'Dashboard Redesign',
          dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'todo',
          isOverdue: true,
          href: '/tasks/task-126',
        },
        isRead: false,
        daysAgo: 0,
      },
      {
        type: NotificationType.TASK_DUE,
        title: 'Tasks due this week',
        body: `You have 5 tasks due this week:

- Complete API documentation (Friday)
- Team sync presentation (Thursday)
- Bug fixes sprint (Wednesday)
- Code review for auth module (Tomorrow)
- Update project timeline (Today)

Stay on track and manage your time effectively!`,
        data: {
          taskCount: 5,
          tasks: [
            { name: 'Complete API documentation', dueDate: 'Friday' },
            { name: 'Team sync presentation', dueDate: 'Thursday' },
            { name: 'Bug fixes sprint', dueDate: 'Wednesday' },
            { name: 'Code review for auth module', dueDate: 'Tomorrow' },
            { name: 'Update project timeline', dueDate: 'Today' },
          ],
          href: '/tasks?filter=due-this-week',
        },
        isRead: true,
        daysAgo: 1,
      },

      // HABIT_REMINDER notifications
      {
        type: NotificationType.HABIT_REMINDER,
        title: 'Time for your morning routine',
        body: `Don't forget to track your morning routine habits:

- ☐ Morning meditation (10 min)
- ☐ Exercise (30 min)
- ☐ Healthy breakfast
- ☐ Review daily goals

Keep up the great work! You're on a 12-day streak!`,
        data: {
          habitId: new Types.ObjectId().toString(),
          habitName: 'Morning Routine',
          habitColor: '#10B981',
          currentStreak: 12,
          frequency: 'daily',
          reminderTime: '07:00',
          href: '/habits/habit-001',
        },
        isRead: false,
        daysAgo: 0,
      },
      {
        type: NotificationType.HABIT_REMINDER,
        title: 'Weekly review reminder',
        body: `Time for your weekly review!

Reflect on this week:
- What went well?
- What could be improved?
- What are your goals for next week?

You've completed 8 weekly reviews so far. Keep building this habit!`,
        data: {
          habitId: new Types.ObjectId().toString(),
          habitName: 'Weekly Review',
          habitColor: '#8B5CF6',
          currentStreak: 8,
          frequency: 'weekly',
          reminderTime: 'Friday 17:00',
          href: '/habits/habit-002',
        },
        isRead: true,
        daysAgo: 3,
      },

      // GOAL_MILESTONE notifications
      {
        type: NotificationType.GOAL_MILESTONE,
        title: 'Milestone achieved! 🎉',
        body: `Congratulations! You've reached a major milestone:

Goal: Complete certification course
Progress: 75% (9/12 modules)
Milestone: Completed Module 9 - Advanced Topics

You're making excellent progress. Keep going!`,
        data: {
          goalId: new Types.ObjectId().toString(),
          goalName: 'Complete certification course',
          milestoneName: 'Module 9 Completed',
          progressPercent: 75,
          currentStep: 9,
          totalSteps: 12,
          href: '/goals/goal-001',
        },
        isRead: false,
        daysAgo: 1,
      },
      {
        type: NotificationType.GOAL_MILESTONE,
        title: 'Goal progress update',
        body: `Your goal "Read 24 books this year" is on track:

- Current: 18 books
- Target: 24 books
- Progress: 75%
- Pace: On track to finish by December

At this rate, you'll exceed your goal by 2 books!`,
        data: {
          goalId: new Types.ObjectId().toString(),
          goalName: 'Read 24 books this year',
          currentValue: 18,
          targetValue: 24,
          progressPercent: 75,
          isOnTrack: true,
          predictedFinal: 26,
          href: '/goals/goal-002',
        },
        isRead: true,
        daysAgo: 5,
      },

      // BUDGET_ALERT notifications
      {
        type: NotificationType.BUDGET_ALERT,
        title: 'Budget alert: 80% spent',
        body: `Your "Monthly Groceries" budget alert:

- Budget: $500.00
- Spent: $402.50 (80%)
- Remaining: $97.50
- Days left: 8

You're slightly above average spending for this time of month.`,
        data: {
          budgetId: new Types.ObjectId().toString(),
          budgetName: 'Monthly Groceries',
          budgetAmount: 500,
          spentAmount: 402.5,
          remainingAmount: 97.5,
          percentUsed: 80,
          currency: 'USD',
          daysRemaining: 8,
          isOverBudget: false,
          href: '/budgets/budget-001',
        },
        isRead: false,
        daysAgo: 0,
      },
      {
        type: NotificationType.BUDGET_ALERT,
        title: '⚠️ Budget exceeded!',
        body: `Your "Entertainment" budget has been exceeded:

- Budget: $200.00
- Spent: $234.50
- Over by: $34.50
- Progress: 117%

Consider reviewing your spending or adjusting the budget.`,
        data: {
          budgetId: new Types.ObjectId().toString(),
          budgetName: 'Entertainment',
          budgetAmount: 200,
          spentAmount: 234.5,
          remainingAmount: -34.5,
          percentUsed: 117,
          currency: 'USD',
          isOverBudget: true,
          href: '/budgets/budget-002',
        },
        isRead: true,
        daysAgo: 4,
      },

      // PROJECT_MENTION notifications
      {
        type: NotificationType.PROJECT_MENTION,
        title: 'You were mentioned in a project',
        body: `Mike Johnson mentioned you in "Mobile App Redesign":

"@narak Can you review the new mockups I uploaded? I'd love your feedback on the navigation flow before we proceed to development."

- Project: Mobile App Redesign
- Comment count: 5
- Last activity: 2 hours ago`,
        data: {
          projectId: new Types.ObjectId().toString(),
          projectName: 'Mobile App Redesign',
          mentionedBy: 'Mike Johnson',
          mentionedByAvatar: 'https://api.dicebear.com/7.x/avataaars?seed=mike',
          commentId: new Types.ObjectId().toString(),
          commentCount: 5,
          href: '/projects/project-001#comment-123',
        },
        isRead: false,
        daysAgo: 0,
      },
      {
        type: NotificationType.PROJECT_MENTION,
        title: 'Project update: Q1 Planning',
        body: `Emily Davis mentioned you in a project update:

"@team Great progress this week! @narak The API docs look fantastic. Let's sync on Monday to discuss the next phase."

Keep up the excellent work!`,
        data: {
          projectId: new Types.ObjectId().toString(),
          projectName: 'Q1 Planning',
          mentionedBy: 'Emily Davis',
          mentionedByAvatar:
            'https://api.dicebear.com/7.x/avataaars?seed=emily',
          updateType: 'status-update',
          href: '/projects/project-002',
        },
        isRead: true,
        daysAgo: 2,
      },

      // WORKSPACE_INVITATION notifications
      {
        type: NotificationType.WORKSPACE_INVITATION,
        title: 'New workspace invitation',
        body: `You've been invited to join "Design Team" workspace!

Invited by: Rachel Green
Role: Member
Workspace type: Collaborative

This workspace focuses on design collaboration, asset sharing, and design system development.`,
        data: {
          workspaceId: new Types.ObjectId().toString(),
          workspaceName: 'Design Team',
          invitedBy: 'Rachel Green',
          invitedByAvatar: 'https://api.dicebear.com/7.x/avataaars?seed=rachel',
          role: 'MEMBER',
          workspaceType: 'collaborative',
          memberCount: 12,
          href: '/workspaces/invitations/invite-001',
        },
        isRead: false,
        daysAgo: 1,
      },
      {
        type: NotificationType.WORKSPACE_INVITATION,
        title: 'Join request approved',
        body: `Your request to join "Engineering Hub" has been approved!

You are now a member of this workspace. Start collaborating with the team and exploring the projects.

Welcome aboard! 🎉`,
        data: {
          workspaceId: new Types.ObjectId().toString(),
          workspaceName: 'Engineering Hub',
          approvedBy: 'Tom Wilson',
          role: 'MEMBER',
          memberCount: 28,
          href: '/workspaces/workspace-002',
        },
        isRead: true,
        daysAgo: 6,
      },

      // COMMENT_REPLY notifications
      {
        type: NotificationType.COMMENT_REPLY,
        title: 'New reply to your comment',
        body: `Chris Martinez replied to your comment on "Homepage Redesign":

"That's a great point! I think we should also consider the mobile experience. What if we add a collapsible sidebar for smaller screens?"

- Task: Homepage Redesign
- Thread: 4 replies
- Posted: 30 minutes ago`,
        data: {
          commentId: new Types.ObjectId().toString(),
          taskId: new Types.ObjectId().toString(),
          taskName: 'Homepage Redesign',
          repliedBy: 'Chris Martinez',
          repliedByAvatar: 'https://api.dicebear.com/7.x/avataaars?seed=chris',
          replyCount: 4,
          href: '/tasks/task-127#comment-456',
        },
        isRead: false,
        daysAgo: 0,
      },
      {
        type: NotificationType.COMMENT_REPLY,
        title: 'You were mentioned in a comment',
        body: `Jordan Lee mentioned you in a comment:

"@narak Could you clarify the requirements for the authentication flow? I want to make sure we're on the same page before implementing."

- Project: Auth Module Rewrite
- Context: Discussion about JWT implementation`,
        data: {
          commentId: new Types.ObjectId().toString(),
          projectId: new Types.ObjectId().toString(),
          projectName: 'Auth Module Rewrite',
          mentionedBy: 'Jordan Lee',
          repliedByAvatar: 'https://api.dicebear.com/7.x/avataaars?seed=jordan',
          context: 'JWT authentication discussion',
          href: '/projects/project-003#comment-789',
        },
        isRead: true,
        daysAgo: 3,
      },

      // SYSTEM notifications
      {
        type: NotificationType.SYSTEM,
        title: 'Weekly summary available',
        body: `Your weekly productivity summary is ready!

This week's highlights:
- ✅ 23 tasks completed
- 🔥 5-day habit streak
- 📈 85% goal progress
- 💬 47 messages sent

View your full summary to see detailed insights and trends.`,
        data: {
          summaryType: 'weekly',
          tasksCompleted: 23,
          habitStreak: 5,
          goalProgress: 85,
          messagesCount: 47,
          periodStart: new Date(
            now.getTime() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          periodEnd: now.toISOString(),
          href: '/performance/weekly-summary',
        },
        isRead: false,
        daysAgo: 0,
      },
      {
        type: NotificationType.SYSTEM,
        title: 'New feature: AI-powered insights',
        body: `We've added AI-powered insights to your dashboard!

New features:
- Smart task prioritization
- Goal achievement predictions
- Productivity pattern detection
- Automated weekly reports

Check out the new Insights panel to see personalized recommendations.`,
        data: {
          featureType: 'ai-insights',
          releaseVersion: '2.4.0',
          releaseNotes: '/changelog/2.4.0',
          href: '/performance/insights',
        },
        isRead: true,
        daysAgo: 7,
      },
      {
        type: NotificationType.SYSTEM,
        title: 'Security alert: New login detected',
        body: `We detected a new login to your account:

- Device: Chrome on macOS
- Location: San Francisco, CA
- Time: Today at 9:23 AM

If this wasn't you, please change your password immediately.`,
        data: {
          alertType: 'security',
          device: 'Chrome on macOS',
          location: 'San Francisco, CA',
          loginTime: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
          href: '/settings/security',
        },
        isRead: true,
        daysAgo: 0,
      },
    ];
  }

  /**
   * Seed notifications for a specific user and workspace
   */
  async seedForUser(userId: string, workspaceId: string): Promise<number> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const workspaceObjectId = new Types.ObjectId(workspaceId);

      const mockNotifications = this.getMockNotifications(
        userObjectId,
        workspaceObjectId,
      );

      const existingCount = await this.notificationModel
        .countDocuments({
          userId: userObjectId,
        })
        .exec();

      if (existingCount > 0) {
        this.logger.log(
          `User ${userId} already has ${existingCount} notifications. Skipping seed.`,
        );
        return 0;
      }

      const notificationsToInsert = mockNotifications.map((mock) => {
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - mock.daysAgo);

        return {
          workspaceId: workspaceObjectId,
          userId: userObjectId,
          recipientUserId: userObjectId,
          createdBy: userObjectId,
          type: mock.type,
          title: mock.title,
          body: mock.body,
          data: mock.data,
          isRead: mock.isRead,
          readAt: mock.isRead ? createdAt : null,
          createdAt,
          updatedAt: createdAt,
        };
      });

      const result = await this.notificationModel.insertMany(
        notificationsToInsert,
        { ordered: false },
      );

      this.logger.log(
        `Successfully seeded ${result.length} notifications for user ${userId}`,
      );

      return result.length;
    } catch (error) {
      this.logger.error(
        `Failed to seed notifications for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Seed notifications for multiple users
   */
  async seedForUsers(
    users: Array<{ userId: string; workspaceId: string }>,
  ): Promise<number> {
    let totalSeeded = 0;

    for (const user of users) {
      const count = await this.seedForUser(user.userId, user.workspaceId);
      totalSeeded += count;
    }

    return totalSeeded;
  }

  /**
   * Clear all notifications (useful for development reset)
   */
  async clearAll(): Promise<number> {
    const result = await this.notificationModel.deleteMany({}).exec();
    this.logger.log(`Cleared ${result.deletedCount} notifications`);
    return result.deletedCount;
  }

  /**
   * Clear notifications for a specific user
   */
  async clearForUser(userId: string): Promise<number> {
    const result = await this.notificationModel
      .deleteMany({ userId: new Types.ObjectId(userId) })
      .exec();
    this.logger.log(
      `Cleared ${result.deletedCount} notifications for user ${userId}`,
    );
    return result.deletedCount;
  }
}
