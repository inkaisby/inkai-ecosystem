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
import { createServer } from 'http';
import { Server } from 'socket.io';
import prisma from './utils/prisma';




dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('public/uploads'));

// Global Request Logger for Debugging
app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

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

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { conversationId, senderId, content } = data;
      
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          content
        },
        include: {
          sender: {
            select: { id: true, fullName: true }
          }
        }
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date(), lastMessageAt: new Date() }
      });

      io.to(conversationId).emit('receive_message', message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`
  🚀 Server ready at http://localhost:${PORT}
  Environment: ${process.env.NODE_VERSION || 'development'}
  `);
});

export default app;

