import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { AppError } from './utils/appError';
import { HTTP_STATUS } from './constants/httpStatus';
import { ENV } from './config/env';

const app: Application = express();

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/v1', routes);

// 404 Not Found Handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Không tìm thấy đường dẫn ${req.originalUrl} trên máy chủ`, HTTP_STATUS.NOT_FOUND));
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
