import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Types } from 'mongoose';
import { AppModule } from '../../src/app.module';
import { IssueSeeder } from '../../src/issues/seeds/issue-seeder';

async function bootstrap() {
  const logger = new Logger('IssueSeeder');
  const args = process.argv.slice(2);
  const clearIndex = args.indexOf('--clear');
  const workspaceIndex = args.indexOf('--workspace');
  const reporterIndex = args.indexOf('--reporter');

  let app;

  try {
    app = await NestFactory.createApplicationContext(AppModule);
    const seeder = app.get(IssueSeeder);

    if (clearIndex !== -1 && workspaceIndex === -1) {
      const count = await seeder.clearAll();
      logger.log(`✅ Cleared ${count} issues`);
      await app.close();
      return;
    }

    if (workspaceIndex === -1) {
      logger.log('🌱 Issue seeder requires a workspace context.');
      logger.log('Example usage:');
      logger.log('  pnpm seed:issues --workspace <workspaceId>');
      logger.log(
        '  pnpm seed:issues --workspace <workspaceId> --reporter <userId>',
      );
      logger.log('  pnpm seed:issues:clear --workspace <workspaceId>');
      logger.log('  pnpm ts-node tools/seeds/seed-issues.ts --clear');
      await app.close();
      return;
    }

    const workspaceId = args[workspaceIndex + 1];
    const reporterId =
      reporterIndex !== -1 ? args[reporterIndex + 1] : undefined;

    if (!workspaceId) {
      logger.error('❌ Please provide a workspace id after --workspace');
      process.exit(1);
    }

    if (!Types.ObjectId.isValid(workspaceId)) {
      logger.error('❌ Invalid workspace ObjectId format');
      process.exit(1);
    }

    if (reporterId && !Types.ObjectId.isValid(reporterId)) {
      logger.error('❌ Invalid reporter ObjectId format');
      process.exit(1);
    }

    if (clearIndex !== -1) {
      const count = await seeder.clearForWorkspace(workspaceId);
      logger.log(`✅ Cleared ${count} issues for workspace ${workspaceId}`);
      await app.close();
      return;
    }

    const count = await seeder.seedForWorkspace(workspaceId, reporterId);
    logger.log(`✅ Seeded ${count} issues for workspace ${workspaceId}`);
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
