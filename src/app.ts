import express from 'express';
import authRoutes from './presentation/routes/authRoutes.js';
import licenciaRoutes from './presentation/routes/licenciaRoutes.js';
import notificationRoutes from './presentation/routes/notificationRoutes.js';
import empleadoRoutes from './presentation/routes/empleadoRoutes.js';
import { errorHandler } from './presentation/middlewares/errorHandler.js';

const app = express();

// Middlewares globales de seguridad y serialización
app.use(express.json({ limit: '4kb' }));
app.use(express.urlencoded({ extended: true }));

// Ruta de comprobación de salud (Health Check)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'assetops-backend',
    architecture: 'Clean Architecture (4 Capas) + CQRS',
    timestamp: new Date().toISOString(),
  });
});

// Montaje de rutas modulares (Arquitectura CQRS)
app.use('/api/auth', authRoutes);
app.use('/api/licencias', licenciaRoutes);
app.use('/api/notificaciones', notificationRoutes);
app.use('/api/empleados', empleadoRoutes);

// Manejador centralizado de errores
app.use(errorHandler);

export default app;
