import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import memberRoutes from './routes/memberRoutes';
import orgRoutes from './routes/orgRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import eventRoutes from './routes/eventRoutes';
import billingRoutes from './routes/billingRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import notificationRoutes from './routes/notificationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import verificationRoutes from './routes/verificationRoutes';
import syncRoutes from './routes/syncRoutes';
import roleRoutes from './routes/roleRoutes';
import chatRoutes from './routes/chatRoutes';
import memberGuideRoutes from './routes/memberGuideRoutes';
import navTabRoutes from './routes/navTabRoutes';
import newsCarouselRoutes from './routes/newsCarouselRoutes';
import auditRoutes from './routes/auditRoutes';
import { createServer } from 'http';
import prisma from './utils/prisma';
import { initSentryBackend, captureSafeException } from './utils/sentry';
import { globalRateLimiter, securityCCTV } from './middleware/securityMiddleware';

dotenv.config();

initSentryBackend();

const app = express();
const PORT = process.env.PORT || 5001;

if (
  !!process.env.VERCEL ||
  process.env.TRUST_PROXY === '1' ||
  process.env.TRUST_PROXY === 'true'
) {
  app.set('trust proxy', 1);
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://*.supabase.co'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

const ALLOWED_ORIGINS = [
  'https://inkai-mobile-web.vercel.app',
  'https://inkai-web-admin.vercel.app',
  'https://inkai-ecosystem.vercel.app',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:3001'] : []),
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static('public/uploads'));

// Global rate limiting and Security CCTV Logging ("Digital Security Guards")
app.use(globalRateLimiter);
app.use(securityCCTV);

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[DEBUG] Incoming Request: ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/members', memberRoutes);
app.use('/v1/org', orgRoutes);
app.use('/v1/attendance', attendanceRoutes);
app.use('/v1/events', eventRoutes);
app.use('/v1/billing', billingRoutes);
app.use('/v1/inventory', inventoryRoutes);
app.use('/v1/notifications', notificationRoutes);
app.use('/v1/dashboard', dashboardRoutes);
app.use('/v1/verifications', verificationRoutes);
app.use('/v1/sync', syncRoutes);
app.use('/v1/roles', roleRoutes);
app.use('/v1/chat', chatRoutes);
app.use('/v1/nav-tabs', navTabRoutes);
app.use('/v1/news-carousel', newsCarouselRoutes);
app.use('/v1/audit-logs', auditRoutes);
app.use('/v1', memberGuideRoutes);

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'INKAI API Server is running (Optimized)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/** Uji Prisma ↔ Postgres (pakai sama seperti endpoint login). */
app.get('/health/db', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.user.findFirst({
      select: { id: true },
    });
    res.json({ ok: true, timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({
      ok: false,
      message: 'Database unreachable or misconfigured. Check DATABASE_URL and Supabase status.',
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware (hanya jalan bila controller memanggil `next(error)`).
app.use((err: unknown, req: Request, res: Response, _next: any) => {
  console.error(err);
  captureSafeException(err instanceof Error ? err : new Error(String(err)), {
    path: req.path,
    method: req.method,
  });

  const status =
    typeof err === 'object' &&
    err !== null &&
    'statusCode' in err &&
    typeof (err as { statusCode: unknown }).statusCode === 'number'
      ? (err as { statusCode: number }).statusCode
      : 500;

  const code = status >= 400 && status < 600 ? status : 500;
  const body: { status: string; message: string } = {
    status: 'error',
    message:
      code === 500 ? 'Internal Server Error' : (err as Error)?.message || 'Request error',
  };
  res.status(code).json(body);
});

const httpServer = createServer(app);

/** Vercel menyuntik handler serverless — jangan `listen()` di platform itu. */
if (!process.env.VERCEL) {
  httpServer.listen(PORT, () => {
    console.log(`
  🚀 Server ready at http://localhost:${PORT}
  Environment: ${process.env.NODE_VERSION || 'development'}
  `);
  });
}

export default app;

