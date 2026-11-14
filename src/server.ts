import app from './app';
import { connectDatabase } from './config/db';
import { ENV } from './config/env';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDatabase();

    // 2. Start HTTP Server
    const server = app.listen(ENV.PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Minh Tu Center Backend running on port ${ENV.PORT}`);
      console.log(`📡 Environment: ${ENV.NODE_ENV}`);
      console.log(`🔗 API Base URL: http://localhost:${ENV.PORT}/api/v1`);
      console.log(`🩺 Health check: http://localhost:${ENV.PORT}/api/v1/health`);
      console.log(`===============================================`);
    });

    // Graceful Shutdown
    const exitHandler = () => {
      if (server) {
        server.close(() => {
          console.log('HTTP Server closed');
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    };

    const unexpectedErrorHandler = (error: unknown) => {
      console.error('Unexpected error occurred:', error);
      exitHandler();
    };

    process.on('uncaughtException', unexpectedErrorHandler);
    process.on('unhandledRejection', unexpectedErrorHandler);

    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received. Closing server gracefully...');
      server.close(() => {
        console.log('Process terminated.');
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
