import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AppModule } from '../../src/app.module';
import { ProjectSeeder } from '../../src/projects/seeds/project-seeder';

/**
 * Project Seeder CLI
 *
 * Usage:
 *   pnpm seed:projects --workspace <workspaceId>
 *   pnpm seed:projects --workspace <workspaceId> --owner <userId>
 *   pnpm seed:projects:clear --workspace <workspaceId>
 *   pnpm ts-node tools/seeds/seed-projects.ts --clear
 */

async function bootstrap() {
  const logger = new Logger('ProjectSeeder');
  const args = process.argv.slice(2);

  let app;

  try {
    app = await NestFactory.createApplicationContext(AppModule);
    const seeder = app.get(ProjectSeeder);

    const clearIndex = args.indexOf('--clear');
    const workspaceIndex = args.indexOf('--workspace');
    const ownerIndex = args.indexOf('--owner');

    if (clearIndex !== -1 && workspaceIndex === -1) {
      const count = await seeder.clearAll();
      logger.log(`✅ Cleared ${count} projects`);
      await app.close();
      return;
    }

    if (workspaceIndex === -1) {
      logger.log('🌱 Project seeder requires a workspace context.');
      logger.log('');
      logger.log('Example usage:');
      logger.log('  pnpm seed:projects --workspace <workspaceId>');
      logger.log(
        '  pnpm seed:projects --workspace <workspaceId> --owner <userId>',
      );
      logger.log('  pnpm seed:projects:clear --workspace <workspaceId>');
      logger.log('  pnpm ts-node tools/seeds/seed-projects.ts --clear');
      await app.close();
      return;
    }

    const workspaceId = args[workspaceIndex + 1];
    const ownerUserId = ownerIndex !== -1 ? args[ownerIndex + 1] : undefined;

    if (!workspaceId) {
      logger.error('❌ Please provide a workspace id after --workspace');
      process.exit(1);
    }

    if (!Types.ObjectId.isValid(workspaceId)) {
      logger.error('❌ Invalid workspace ObjectId format');
      process.exit(1);
    }

    if (ownerUserId && !Types.ObjectId.isValid(ownerUserId)) {
      logger.error('❌ Invalid owner ObjectId format');
      process.exit(1);
    }

    if (clearIndex !== -1) {
      const count = await seeder.clearForWorkspace(workspaceId);
      logger.log(`✅ Cleared ${count} projects for workspace ${workspaceId}`);
      await app.close();
      return;
    }

    const count = await seeder.seedForWorkspace(workspaceId, ownerUserId);
    logger.log(`✅ Seeded ${count} projects for workspace ${workspaceId}`);
    await app.close();
  } catch (error) {
    logger.error(
      `❌ Seeder failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    if (app) {
      await app.close();
    }
    process.exit(1);
  }
}

void bootstrap();
