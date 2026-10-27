import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

import { ENV } from './config/env';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/authRoutes';
import medicineRoutes from './routes/medicineRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import doseRoutes from './routes/doseRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import notificationRoutes from './routes/notificationRoutes';
import caregiverRoutes from './routes/caregiverRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import adminRoutes from './routes/adminRoutes';

export function createApp(): Express {
  const app = express();

  // Trust proxy for Render and modern reverse proxies
  app.set('trust proxy', 1);

  // Security headers with relaxed CSP for local development & PWA
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration
  const allowedOrigins = [
    ENV.APP_BASE_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Allow during testing / mobile devices on LAN
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate Limiting
  app.use('/api', apiRateLimiter);

  // System Health Endpoints
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      app: 'DOSEBLOOM API',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/ready', (req: Request, res: Response) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      res.status(200).json({ status: 'ready', database: 'connected' });
    } else {
      res.status(503).json({ status: 'not_ready', database: 'disconnected' });
    }
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/medicines', medicineRoutes);
  app.use('/api/schedules', scheduleRoutes);
  app.use('/api/doses', doseRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/caregivers', caregiverRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/admin', adminRoutes);

  // Production Single-URL Web Experience: Serve React client build
  const clientDistCandidates = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
  ];

  const clientDistPath = clientDistCandidates.find((p) => fs.existsSync(p));

  if (clientDistPath) {
    console.log(`[App] Serving production frontend from: ${clientDistPath}`);
    app.use(express.static(clientDistPath));

    app.get('*', (req: Request, res: Response, next) => {
      // Don't intercept API routes
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
