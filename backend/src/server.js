import mongoose from "mongoose";
import { createServer } from "http";

import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { closeChatSocketRedis, initializeChatSocket } from "./features/chat/chat.socket.js";
import { backfillDomainAreaForExistingUsers, backfillAnonUsernames } from "./features/user/user.service.js";
import { seedInterviewTemplates } from "./scripts/seedInterviewTemplates.js";
import { closeCacheRedis } from "./utils/cache.js";
import { logger } from "./utils/logger.js";
import { initSentry } from "./utils/sentry.js";

initSentry();

let server;

async function gracefulShutdown(signal) {
  logger.info({ signal }, "Shutdown signal received; closing resources");

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await closeChatSocketRedis();
  await closeCacheRedis();
  await mongoose.connection.close();
  process.exit(0);
}

async function bootstrap() {
  try {
    await connectDatabase(env.mongoUri);
    const migrationResult = await backfillDomainAreaForExistingUsers();
    logger.info(
      {
        matchedCount: migrationResult.matchedCount,
        modifiedCount: migrationResult.modifiedCount
      },
      "domainArea backfill complete"
    );
    await seedInterviewTemplates();

    const anonResult = await backfillAnonUsernames();
    logger.info(
      {
        total: anonResult.total,
        success: anonResult.successCount,
        failed: anonResult.failCount
      },
      "anonUsername backfill complete"
    );

    const httpServer = createServer(app);
    await initializeChatSocket(httpServer);

    server = httpServer.listen(env.port, "0.0.0.0", () => {
  logger.info(
    { port: env.port, host: "0.0.0.0", env: env.nodeEnv },
    "Server listening"
  );
});
/* OLD CHANGED
    server = httpServer.listen(env.port, () => {
      logger.info({ port: env.port, env: env.nodeEnv }, "Server listening");
    });
*/
    process.on("SIGTERM", () => {
      gracefulShutdown("SIGTERM").catch((error) => {
        logger.error({ err: error }, "Shutdown failed");
        process.exit(1);
      });
    });

    process.on("SIGINT", () => {
      gracefulShutdown("SIGINT").catch((error) => {
        logger.error({ err: error }, "Shutdown failed");
        process.exit(1);
      });
    });
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start server");
    process.exit(1);
  }
}

bootstrap();
