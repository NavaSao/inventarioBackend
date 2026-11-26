import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../src/infrastructure/config/database.js';
import { BCRYPT_ROUNDS } from '../src/infrastructure/services/AuthService.js';

async function sembrar(): Promise<void> {
  console.log('[*] Sembrando catálogo de licencias y datos en PostgreSQL...');

  // 1. Obtener o crear usuario administrador
  let admin = await prisma.usuario.findFirst({
    where: { correo: { in: ['admin@assetops.test', 'admin@assetops.com'] } },
  });

  if (!admin) {
    console.log('[*] Creando usuario administrador inicial...');
    const passwordHash = await bcrypt.hash('AdminPassword123', BCRYPT_ROUNDS);
    admin = await prisma.usuario.create({
      data: {
        nombre: 'Administrador de TI',
        correo: 'admin@assetops.test',
        passwordHash,
      },
    });
  }

  // 2. Empleados de prueba
  const empleadosData = [
    { numeroEmpleado: 'EMP-001', nombre: 'Laura Méndez', correo: 'laura.mendez@empresa.com', departamento: 'Tecnología', cargo: 'Tech Lead' },
    { numeroEmpleado: 'EMP-002', nombre: 'Carlos Morales', correo: 'carlos.morales@empresa.com', departamento: 'Diseño UX/UI', cargo: 'Senior Product Designer' },
    { numeroEmpleado: 'EMP-003', nombre: 'Sofía Castro', correo: 'sofia.castro@empresa.com', departamento: 'Marketing', cargo: 'Marketing Specialist' },
    { numeroEmpleado: 'EMP-004', nombre: 'David Reyes', correo: 'david.reyes@empresa.com', departamento: 'Ingeniería', cargo: 'Frontend Engineer' },
    { numeroEmpleado: 'EMP-005', nombre: 'Elena Pardo', correo: 'elena.pardo@empresa.com', departamento: 'Operaciones', cargo: 'Operations Manager' },
  ];

  for (const emp of empleadosData) {
    await prisma.empleado.upsert({
      where: { correo: emp.correo },
      update: {},
      create: emp,
    });
  }

  const empleados = await prisma.empleado.findMany();
  const empMap = new Map(empleados.map((e) => [e.nombre, e.idEmpleado]));

  // 3. Catálogo de Licencias
  const hoy = new Date();
  const fecha = (diasOffset: number) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + diasOffset);
    return d;
  };

  const licenciasData = [
    {
      codigoLicencia: 'MS-365-PRO',
      software: 'Microsoft 365',
      plan: 'Business Standard',
      periodicidad: 'Anual',
      proveedor: 'Microsoft Corporation',
      referenciaContrato: 'MS-SUB-2026',
      inicioVigencia: new Date('2026-05-15'),
      finVigencia: new Date('2027-05-15'),
      cuposContratados: 25,
      costo: 3125,
      moneda: 'USD',
    },
    {
      codigoLicencia: 'FIG-ORG-01',
      software: 'Figma Enterprise',
      plan: 'Organization',
      periodicidad: 'Anual',
      proveedor: 'Figma Inc.',
      referenciaContrato: 'FIG-ENT-2025',
      inicioVigencia: new Date('2025-11-30'),
      finVigencia: fecha(9), // Vence en 9 días para activar la alerta del Dashboard
      cuposContratados: 15,
      costo: 10800,
      moneda: 'USD',
    },
    {
      codigoLicencia: 'ADB-ALL-APP',
      software: 'Adobe Creative Cloud',
      plan: 'Todas las aplicaciones',
      periodicidad: 'Mensual',
      proveedor: 'Adobe Systems',
      referenciaContrato: 'ADB-CC-2025',
      inicioVigencia: new Date('2025-10-01'),
      finVigencia: fecha(-10), // Vencida
      cuposContratados: 8,
      costo: 640,
      moneda: 'USD',
    },
    {
      codigoLicencia: 'SLK-PRO-01',
      software: 'Slack Pro',
      plan: 'Pro Plan',
      periodicidad: 'Anual',
      proveedor: 'Slack Technologies',
      referenciaContrato: 'SLK-SUB-2026',
      inicioVigencia: new Date('2026-01-01'),
      finVigencia: new Date('2027-01-01'),
      cuposContratados: 20,
      costo: 1800,
      moneda: 'USD',
    },
    {
      codigoLicencia: 'ZM-BUS-01',
      software: 'Zoom Business',
      plan: 'Business',
      periodicidad: 'Anual',
      proveedor: 'Zoom Video Communications',
      referenciaContrato: 'ZM-SUB-2026',
      inicioVigencia: new Date('2026-02-01'),
      finVigencia: new Date('2027-02-01'),
      cuposContratados: 10,
      costo: 1500,
      moneda: 'USD',
    },
  ];

  for (const lic of licenciasData) {
    await prisma.licencia.upsert({
      where: { codigoLicencia: lic.codigoLicencia },
      update: lic,
      create: lic,
    });
  }

  const licMap = new Map(
    (await prisma.licencia.findMany()).map((l) => [l.codigoLicencia, l.idLicencia])
  );

  // 4. Asignaciones de ejemplo y actividad reciente
  const asignacionesDemo = [
    {
      licCodigo: 'MS-365-PRO',
      empNombre: 'Laura Méndez',
      nota: 'Licencia principal de productividad TI',
      diasAtras: 0,
      liberada: false,
    },
    {
      licCodigo: 'FIG-ORG-01',
      empNombre: 'Carlos Morales',
      nota: 'Diseño de producto y prototipos Figma',
      diasAtras: 1,
      liberada: false,
    },
    {
      licCodigo: 'ADB-ALL-APP',
      empNombre: 'Sofía Castro',
      nota: 'Diseño gráfico publicitario',
      diasAtras: 5,
      liberada: true,
    },
    {
      licCodigo: 'SLK-PRO-01',
      empNombre: 'David Reyes',
      nota: 'Comunicación del equipo de desarrollo',
      diasAtras: 6,
      liberada: false,
    },
    {
      licCodigo: 'ZM-BUS-01',
      empNombre: 'Elena Pardo',
      nota: 'Reuniones ejecutivas',
      diasAtras: 7,
      liberada: true,
    },
  ];

  for (const asig of asignacionesDemo) {
    const idLic = licMap.get(asig.licCodigo);
    const idEmp = empMap.get(asig.empNombre);
    if (!idLic || !idEmp || !admin) continue;

    const fechaAsig = new Date(hoy.getTime() - asig.diasAtras * 86400000);
    const existe = await prisma.asignacionLicencia.findFirst({
      where: { idLicencia: idLic, idEmpleado: idEmp },
    });

    if (!existe) {
      await prisma.asignacionLicencia.create({
        data: {
          idLicencia: idLic,
          idEmpleado: idEmp,
          idUsuarioAsignacion: admin.idUsuario,
          asignadoEn: fechaAsig,
          nota: asig.nota,
          claveAsignacion: crypto.randomUUID(),
          liberadoEn: asig.liberada ? new Date(fechaAsig.getTime() + 7200000) : null,
          idUsuarioLiberacion: asig.liberada ? admin.idUsuario : null,
          claveLiberacion: asig.liberada ? crypto.randomUUID() : null,
        },
      });
    }
  }

  console.log('\n======================================================');
  console.log('       SIEMBRA DE DATOS COMPLETADA CON ÉXITO          ');
  console.log('======================================================');
  console.log('[*] Licencias agregadas : Microsoft 365, Figma, Adobe CC, Slack, Zoom');
  console.log('[*] Empleados agregados : Laura Méndez, Carlos Morales, Sofía Castro...');
  console.log('[*] Movimientos activos : Asignaciones vinculadas al Dashboard');
  console.log('======================================================\n');
}

try {
  await sembrar();
} catch (error) {
  console.error('Error al sembrar datos:', error);
} finally {
  await prisma.$disconnect();
}
