import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './modules/auth/auth.route';
import userRoutes from './modules/users/user.route';
import productRoutes from './modules/products/product.route';
import tableRoutes from './modules/tables/table.route';
import orderRoutes from './modules/orders/order.route';
import uploadRoutes from './modules/upload/upload.routes';
import { errorMiddleware } from './middlewares/errorMiddleware';
import dashboardRoutes from './modules/dashboard/dashboard.route';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Static files cho ảnh upload
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use(errorMiddleware);

export default app;
