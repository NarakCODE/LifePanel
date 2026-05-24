import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AppModule } from '../../src/app.module';
import { NotificationSeeder } from '../../src/notifications/seeds/notification-seeder';

/**
 * Notification Seeder CLI
 * 
 * Usage:
 *   pnpm ts-node tools/seeds/seed-notifications.ts
 *   pnpm ts-node tools/seeds/seed-notifications.ts --clear
 *   pnpm ts-node tools/seeds/seed-notifications.ts --user <userId> --workspace <workspaceId>
 */

async function bootstrap() {
  const logger = new Logger('NotificationSeeder');
  const args = process.argv.slice(2);
  
  let app;
  
  try {
    // Use AppModule to ensure Mongoose and all dependencies are loaded
    app = await NestFactory.createApplicationContext(AppModule);
    const seeder = app.get(NotificationSeeder);

    const clearIndex = args.indexOf('--clear');
    const userIndex = args.indexOf('--user');
    const workspaceIndex = args.indexOf('--workspace');

    // Clear all notifications
    if (clearIndex !== -1) {
      const count = await seeder.clearAll();
      logger.log(`✅ Cleared ${count} notifications`);
      await app.close();
      return;
    }

    // Seed specific user
    if (userIndex !== -1 && workspaceIndex !== -1) {
      const userId = args[userIndex + 1];
      const workspaceId = args[workspaceIndex + 1];

      if (!userId || !workspaceId) {
        logger.error('❌ Please provide both --user and --workspace IDs');
        process.exit(1);
      }

      // Validate ObjectId format
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(workspaceId)) {
        logger.error('❌ Invalid ObjectId format');
        process.exit(1);
      }

      const count = await seeder.seedForUser(userId, workspaceId);
      logger.log(`✅ Seeded ${count} notifications for user ${userId}`);
      await app.close();
      return;
    }

    // Default: Seed with demo data
    logger.log('🌱 Starting notification seeder...');
    logger.log('⚠️  No user/workspace specified. Use --user and --workspace flags to seed specific users.');
    logger.log('');
    logger.log('Example usage:');
    logger.log('  pnpm ts-node tools/seeds/seed-notifications.ts --user <userId> --workspace <workspaceId>');
    logger.log('  pnpm ts-node tools/seeds/seed-notifications.ts --clear');
    
    await app.close();
  } catch (error) {
    logger.error(`❌ Seeder failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (app) {
      await app.close();
    }
    process.exit(1);
  }
}

bootstrap();
