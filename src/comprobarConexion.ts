import { prisma } from './database/prisma.js';

try {
  // Consultar las siete tablas comprueba la conexión y que la migración se aplicó.
  const registros = {
    Usuarios: await prisma.usuario.count(),
    Empleados: await prisma.empleado.count(),
    Activos: await prisma.activo.count(),
    AsignacionesActivos: await prisma.asignacionActivo.count(),
    Licencias: await prisma.licencia.count(),
    AsignacionesLicencias: await prisma.asignacionLicencia.count(),
    Mantenimientos: await prisma.mantenimiento.count(),
  };

  console.log('Conexión correcta con PostgreSQL.');
  console.table(registros);
} catch {
  console.error('No se pudo comprobar la base. Revisa Docker, los datos de .env y ejecuta npm run db:migrate.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
