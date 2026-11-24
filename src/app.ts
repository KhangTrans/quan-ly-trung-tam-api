import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { AppError } from './utils/appError';
import { HTTP_STATUS } from './constants/httpStatus';
import { ENV } from './config/env';

const app: Application = express();

// Security and utility middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Cho phép Swagger UI load style và script inline
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Cho phép iframe đọc file PDF tĩnh
  })
);
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory (serving uploaded PDF textbooks, etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Swagger UI Documentation & Spec Endpoint
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Minh Tu Center API Docs',
  })
);
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/v1', routes);

// 404 Not Found Handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Không tìm thấy đường dẫn ${req.originalUrl} trên máy chủ`, HTTP_STATUS.NOT_FOUND));
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
