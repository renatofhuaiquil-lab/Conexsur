# CONEXSUR — Sistema web de gestión, agendamiento y pagos

Proyecto Capstone (DuocUC). Stack: React + Tailwind (PWA), Node.js/Express, PostgreSQL, Mercado Pago Checkout Pro.

## Estructura

```
server/   API Express (módulos: auth, clientes, visitas, planes, tecnicos, portal, resumen; próximo: pagos)
client/   Aplicación React + Tailwind (Vite)
docs/     Diagramas, capturas, video de demostración y GUIA_INICIO.md (instalación en Mac, GitHub y Jira)
```

Cada módulo del servidor sigue el patrón `rutas → controlador → servicio → repositorio`
(`esquemas` valida la entrada con zod). El SQL vive solo en los repositorios.

## Desarrollo local (sin Docker)

Requisitos: Node 22+ y PostgreSQL 16. Paso a paso detallado (Mac, VS Code, GitHub y Jira) en `docs/GUIA_INICIO.md`.

```bash
# 1. Base de datos
createdb conexsur

# 2. API
cd server
cp .env.example .env        # completar DATABASE_URL y JWT_SECRETO
npm install
npm run migrar              # aplica db/*.sql
npm run semilla             # usuarios de demostración (clave Demo1234!)
npm run dev                 # http://localhost:3000

# 3. Cliente (en otra terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Usuarios de demostración: `admin@conexsur.cl`, `tecnico@conexsur.cl`, `cliente@conexsur.cl`.

## Pruebas

```bash
cd server
createdb conexsur_test      # una sola vez
cp .env.test.example .env.test   # completar la clave
npm test                    # 27 pruebas
```

## Despliegue con Docker

```bash
cp .env.example .env        # completar claves
docker compose up -d --build
```

## Seguridad aplicada

- Contraseñas con scrypt y sal única; bloqueo temporal tras 5 intentos fallidos y límite de solicitudes por IP.
- Sesión en cookie `httpOnly` + `SameSite=Strict` (+ `Secure` en producción) y verificación de `Origin`.
- Validación de toda entrada con zod; consultas SQL parametrizadas; errores sin detalles internos.
- Autorización por rol en el servidor; auditoría de acciones relevantes.
- Variables de entorno validadas al iniciar; el `.env` nunca se versiona.
