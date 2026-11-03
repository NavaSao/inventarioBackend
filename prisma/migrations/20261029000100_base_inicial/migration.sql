BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoActivo" AS ENUM ('DISPONIBLE', 'ASIGNADO', 'EN_MANTENIMIENTO', 'DADO_DE_BAJA');

-- CreateTable
CREATE TABLE "Usuarios" (
    "idUsuario" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "versionSesion" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("idUsuario")
);

-- CreateTable
CREATE TABLE "Empleados" (
    "idEmpleado" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numeroEmpleado" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "departamento" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empleados_pkey" PRIMARY KEY ("idEmpleado")
);

-- CreateTable
CREATE TABLE "Activos" (
    "idActivo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "numeroSerie" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "estado" "EstadoActivo" NOT NULL DEFAULT 'DISPONIBLE',
    "fotoReferencia" TEXT,
    "fechaBaja" TIMESTAMPTZ(3),
    "motivoBaja" TEXT,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activos_pkey" PRIMARY KEY ("idActivo")
);

-- CreateTable
CREATE TABLE "AsignacionesActivos" (
    "idAsignacionActivo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "idActivo" UUID NOT NULL,
    "idEmpleado" UUID NOT NULL,
    "idUsuarioEntrega" UUID NOT NULL,
    "entregadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notaEntrega" TEXT,
    "idUsuarioDevolucion" UUID,
    "devueltoEn" TIMESTAMPTZ(3),
    "notaDevolucion" TEXT,
    "claveEntrega" UUID NOT NULL,
    "claveDevolucion" UUID,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsignacionesActivos_pkey" PRIMARY KEY ("idAsignacionActivo")
);

-- CreateTable
CREATE TABLE "Licencias" (
    "idLicencia" UUID NOT NULL DEFAULT gen_random_uuid(),
    "software" TEXT NOT NULL,
    "proveedor" TEXT,
    "referenciaContrato" TEXT,
    "inicioVigencia" DATE NOT NULL,
    "finVigencia" DATE NOT NULL,
    "cuposContratados" INTEGER NOT NULL,
    "costo" DECIMAL(12,2) NOT NULL,
    "moneda" TEXT NOT NULL,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Licencias_pkey" PRIMARY KEY ("idLicencia")
);

-- CreateTable
CREATE TABLE "AsignacionesLicencias" (
    "idAsignacionLicencia" UUID NOT NULL DEFAULT gen_random_uuid(),
    "idLicencia" UUID NOT NULL,
    "idEmpleado" UUID NOT NULL,
    "idUsuarioAsignacion" UUID NOT NULL,
    "asignadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idUsuarioLiberacion" UUID,
    "liberadoEn" TIMESTAMPTZ(3),
    "nota" TEXT,
    "claveAsignacion" UUID NOT NULL,
    "claveLiberacion" UUID,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsignacionesLicencias_pkey" PRIMARY KEY ("idAsignacionLicencia")
);

-- CreateTable
CREATE TABLE "Mantenimientos" (
    "idMantenimiento" UUID NOT NULL DEFAULT gen_random_uuid(),
    "idActivo" UUID NOT NULL,
    "idUsuarioInicio" UUID NOT NULL,
    "iniciadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notaInicial" TEXT NOT NULL,
    "idUsuarioCierre" UUID,
    "cerradoEn" TIMESTAMPTZ(3),
    "resolucion" TEXT,
    "claveInicio" UUID NOT NULL,
    "claveCierre" UUID,
    "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mantenimientos_pkey" PRIMARY KEY ("idMantenimiento")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_correo_key" ON "Usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Empleados_numeroEmpleado_key" ON "Empleados"("numeroEmpleado");

-- CreateIndex
CREATE UNIQUE INDEX "Empleados_correo_key" ON "Empleados"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Activos_numeroSerie_key" ON "Activos"("numeroSerie");

-- CreateIndex
CREATE UNIQUE INDEX "Activos_etiqueta_key" ON "Activos"("etiqueta");

-- CreateIndex
CREATE INDEX "Activos_estado_idx" ON "Activos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionesActivos_claveEntrega_key" ON "AsignacionesActivos"("claveEntrega");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionesActivos_claveDevolucion_key" ON "AsignacionesActivos"("claveDevolucion");

-- CreateIndex
CREATE INDEX "AsignacionesActivos_idActivo_entregadoEn_idx" ON "AsignacionesActivos"("idActivo", "entregadoEn");

-- CreateIndex
CREATE INDEX "AsignacionesActivos_idEmpleado_devueltoEn_idx" ON "AsignacionesActivos"("idEmpleado", "devueltoEn");

-- CreateIndex
CREATE INDEX "Licencias_finVigencia_idx" ON "Licencias"("finVigencia");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionesLicencias_claveAsignacion_key" ON "AsignacionesLicencias"("claveAsignacion");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionesLicencias_claveLiberacion_key" ON "AsignacionesLicencias"("claveLiberacion");

-- CreateIndex
CREATE INDEX "AsignacionesLicencias_idLicencia_liberadoEn_idx" ON "AsignacionesLicencias"("idLicencia", "liberadoEn");

-- CreateIndex
CREATE INDEX "AsignacionesLicencias_idEmpleado_liberadoEn_idx" ON "AsignacionesLicencias"("idEmpleado", "liberadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "Mantenimientos_claveInicio_key" ON "Mantenimientos"("claveInicio");

-- CreateIndex
CREATE UNIQUE INDEX "Mantenimientos_claveCierre_key" ON "Mantenimientos"("claveCierre");

-- CreateIndex
CREATE INDEX "Mantenimientos_idActivo_iniciadoEn_idx" ON "Mantenimientos"("idActivo", "iniciadoEn");

-- AddForeignKey
ALTER TABLE "AsignacionesActivos" ADD CONSTRAINT "AsignacionesActivos_idActivo_fkey" FOREIGN KEY ("idActivo") REFERENCES "Activos"("idActivo") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AsignacionesActivos" ADD CONSTRAINT "AsignacionesActivos_idEmpleado_fkey" FOREIGN KEY ("idEmpleado") REFERENCES "Empleados"("idEmpleado") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AsignacionesActivos" ADD CONSTRAINT "AsignacionesActivos_idUsuarioEntrega_fkey" FOREIGN KEY ("idUsuarioEntrega") REFERENCES "Usuarios"("idUsuario") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AsignacionesActivos" ADD CONSTRAINT "AsignacionesActivos_idUsuarioDevolucion_fkey" FOREIGN KEY ("idUsuarioDevolucion") REFERENCES "Usuarios"("idUsuario") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AsignacionesLicencias" ADD CONSTRAINT "AsignacionesLicencias_idLicencia_fkey" FOREIGN KEY ("idLicencia") REFERENCES "Licencias"("idLicencia") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AsignacionesLicencias" ADD CONSTRAINT "AsignacionesLicencias_idEmpleado_fkey" FOREIGN KEY ("idEmpleado") REFERENCES "Empleados"("idEmpleado") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AsignacionesLicencias" ADD CONSTRAINT "AsignacionesLicencias_idUsuarioAsignacion_fkey" FOREIGN KEY ("idUsuarioAsignacion") REFERENCES "Usuarios"("idUsuario") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AsignacionesLicencias" ADD CONSTRAINT "AsignacionesLicencias_idUsuarioLiberacion_fkey" FOREIGN KEY ("idUsuarioLiberacion") REFERENCES "Usuarios"("idUsuario") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Mantenimientos" ADD CONSTRAINT "Mantenimientos_idActivo_fkey" FOREIGN KEY ("idActivo") REFERENCES "Activos"("idActivo") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Mantenimientos" ADD CONSTRAINT "Mantenimientos_idUsuarioInicio_fkey" FOREIGN KEY ("idUsuarioInicio") REFERENCES "Usuarios"("idUsuario") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Mantenimientos" ADD CONSTRAINT "Mantenimientos_idUsuarioCierre_fkey" FOREIGN KEY ("idUsuarioCierre") REFERENCES "Usuarios"("idUsuario") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Reglas de la misma fila que PostgreSQL puede garantizar sin la API.
ALTER TABLE "Usuarios" ADD CONSTRAINT "Usuarios_datos_validos" CHECK (
  btrim("nombre") <> '' AND "correo" = lower(btrim("correo")) AND "correo" <> ''
  AND btrim("passwordHash") <> '' AND "versionSesion" >= 0
);

ALTER TABLE "Empleados" ADD CONSTRAINT "Empleados_datos_validos" CHECK (
  btrim("nombre") <> '' AND "numeroEmpleado" = upper(btrim("numeroEmpleado"))
  AND "numeroEmpleado" <> '' AND "correo" = lower(btrim("correo")) AND "correo" <> ''
);

ALTER TABLE "Activos" ADD CONSTRAINT "Activos_datos_validos" CHECK (
  btrim("nombre") <> '' AND btrim("categoria") <> '' AND btrim("ubicacion") <> ''
  AND "numeroSerie" = upper(btrim("numeroSerie")) AND "numeroSerie" <> ''
  AND "etiqueta" = upper(btrim("etiqueta")) AND "etiqueta" <> ''
);

ALTER TABLE "Activos" ADD CONSTRAINT "Activos_baja_completa" CHECK (
  ("estado" = 'DADO_DE_BAJA' AND "fechaBaja" IS NOT NULL
    AND "motivoBaja" IS NOT NULL AND btrim("motivoBaja") <> '')
  OR ("estado" <> 'DADO_DE_BAJA' AND "fechaBaja" IS NULL AND "motivoBaja" IS NULL)
);

ALTER TABLE "Licencias" ADD CONSTRAINT "Licencias_datos_validos" CHECK (
  btrim("software") <> '' AND "cuposContratados" > 0 AND "costo" >= 0
  AND "finVigencia" >= "inicioVigencia" AND "moneda" ~ '^[A-Z]{3}$'
);

ALTER TABLE "AsignacionesActivos" ADD CONSTRAINT "AsignacionesActivos_cierre_completo" CHECK (
  ("devueltoEn" IS NULL AND "idUsuarioDevolucion" IS NULL AND "claveDevolucion" IS NULL)
  OR ("devueltoEn" IS NOT NULL AND "idUsuarioDevolucion" IS NOT NULL
      AND "claveDevolucion" IS NOT NULL AND "devueltoEn" >= "entregadoEn")
);

ALTER TABLE "AsignacionesLicencias" ADD CONSTRAINT "AsignacionesLicencias_cierre_completo" CHECK (
  ("liberadoEn" IS NULL AND "idUsuarioLiberacion" IS NULL AND "claveLiberacion" IS NULL)
  OR ("liberadoEn" IS NOT NULL AND "idUsuarioLiberacion" IS NOT NULL
      AND "claveLiberacion" IS NOT NULL AND "liberadoEn" >= "asignadoEn")
);

ALTER TABLE "Mantenimientos" ADD CONSTRAINT "Mantenimientos_nota_obligatoria"
  CHECK (btrim("notaInicial") <> '');

ALTER TABLE "Mantenimientos" ADD CONSTRAINT "Mantenimientos_cierre_completo" CHECK (
  ("cerradoEn" IS NULL AND "idUsuarioCierre" IS NULL AND "claveCierre" IS NULL AND "resolucion" IS NULL)
  OR ("cerradoEn" IS NOT NULL AND "idUsuarioCierre" IS NOT NULL AND "claveCierre" IS NOT NULL
      AND "resolucion" IS NOT NULL AND btrim("resolucion") <> '' AND "cerradoEn" >= "iniciadoEn")
);

-- La condición permite mantener varias filas históricas, pero solo una abierta.
CREATE UNIQUE INDEX "AsignacionesActivos_un_activo_abierto"
  ON "AsignacionesActivos" ("idActivo") WHERE "devueltoEn" IS NULL;

CREATE UNIQUE INDEX "AsignacionesLicencias_un_cupo_por_empleado"
  ON "AsignacionesLicencias" ("idLicencia", "idEmpleado") WHERE "liberadoEn" IS NULL;

CREATE UNIQUE INDEX "Mantenimientos_un_activo_abierto"
  ON "Mantenimientos" ("idActivo") WHERE "cerradoEn" IS NULL;

COMMIT;
