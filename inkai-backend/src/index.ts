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




dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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





// Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'INKAI API Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`
  🚀 Server ready at http://localhost:${PORT}
  Environment: ${process.env.NODE_VERSION || 'development'}
  `);
});
