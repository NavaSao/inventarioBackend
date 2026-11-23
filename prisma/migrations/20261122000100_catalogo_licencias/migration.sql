BEGIN;

ALTER TABLE "Empleados" ADD COLUMN "cargo" TEXT;

ALTER TABLE "Licencias"
  ADD COLUMN "codigoLicencia" TEXT,
  ADD COLUMN "plan" TEXT,
  ADD COLUMN "periodicidad" TEXT,
  ALTER COLUMN "costo" DROP NOT NULL,
  ALTER COLUMN "moneda" DROP NOT NULL;

-- Las contrataciones existentes conservan su identificador como código inicial.
UPDATE "Licencias" SET "codigoLicencia" = upper("idLicencia"::text);

ALTER TABLE "Licencias"
  ALTER COLUMN "codigoLicencia" SET NOT NULL,
  ADD CONSTRAINT "Licencias_codigo_normalizado"
    CHECK ("codigoLicencia" <> '' AND "codigoLicencia" = upper(btrim("codigoLicencia"))),
  ADD CONSTRAINT "Licencias_costo_y_moneda"
    CHECK (("costo" IS NULL) = ("moneda" IS NULL));

CREATE UNIQUE INDEX "Licencias_codigoLicencia_key" ON "Licencias"("codigoLicencia");

COMMIT;
