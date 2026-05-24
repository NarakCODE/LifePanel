import { Logger } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose from 'mongoose';

const CHAT_COLLECTIONS = [
  'chat_channels',
  'chat_messages',
  'chat_channel_members',
  'chat_configs',
] as const;

function loadEnvFile(fileName: string): void {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, 'utf8');

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value.replace(/^['"]|['"]$/g, '');
  }
}

async function dropCollectionIfExists(
  logger: Logger,
  collectionName: (typeof CHAT_COLLECTIONS)[number],
): Promise<void> {
  const database = mongoose.connection.db;
  if (!database) {
    throw new Error('MongoDB connection is not available');
  }

  const existing = await database
    .listCollections({ name: collectionName }, { nameOnly: true })
    .toArray();

  if (existing.length === 0) {
    logger.log(`Skipped ${collectionName} (not found)`);
    return;
  }

  await database.dropCollection(collectionName);
  logger.log(`Dropped ${collectionName}`);
}

async function bootstrap(): Promise<void> {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  const logger = new Logger('DropChatCollections');
  const mongoUri =
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/life-dashboard';

  try {
    await mongoose.connect(mongoUri);
    logger.log(`Connected to MongoDB`);

    for (const collectionName of CHAT_COLLECTIONS) {
      await dropCollectionIfExists(logger, collectionName);
    }

    logger.log('Chat collection cleanup complete');
  } catch (error) {
    logger.error(
      `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void bootstrap();
