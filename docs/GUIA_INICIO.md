# Guía de inicio — CONEXSUR (MacBook)

Sirve para: (1) instalar lo necesario, (2) ejecutar el sistema con Visual Studio Code, (3) subirlo a GitHub, (4) dejar el tablero de Jira igual que los Word y (5) poder explicar el código en la presentación.

Los videos son búsquedas de YouTube: revisé los títulos, no los vi completos. Si un video muestra otra versión, vale el paso a paso de esta guía.

---

## 1. Instalar en el Mac (una sola vez, 40 a 60 minutos)

Abre la **Terminal** (`Cmd + Espacio`, escribe "Terminal"). Instala en este orden:

| Orden | Programa | Versión | Cómo | Comprobar | Video |
|---|---|---|---|---|---|
| 1 | Git (herramientas de línea de comandos de Apple) | La que entrega Apple | En la Terminal: `xcode-select --install` → *Instalar* (5 a 20 minutos) | `git --version` | [Instalar git en Mac y subir proyectos de VSCode a GitHub](https://www.youtube.com/watch?v=2CT_OZSOTpQ) |
| 2 | Node.js (incluye npm) | **22 LTS** (22.12 o superior) | nodejs.org → *Downloads* → elige **v22** (la página puede ofrecer otra por defecto) → instalador macOS `.pkg` | `node -v` (v22.x) y `npm -v` (10.x) | [Descargar e instalar Node.js en Mac (Apple Silicon)](https://www.youtube.com/watch?v=sJ1UpZdHt5Y) |
| 3 | Visual Studio Code | Última estable | code.visualstudio.com → *Download for Mac* → descomprime y arrastra a *Aplicaciones* | Se abre | [Instalar Visual Studio Code en macOS](https://www.youtube.com/watch?v=tn-OsC3uvbI) |
| 4 | PostgreSQL con **Postgres.app** | **16** (si no aparece, 17) | postgresapp.com → descarga → arrastra a *Aplicaciones* → ábrela → *Initialize* | Ícono de elefante en la barra de menú y servidor "Running" | [Cómo instalar PostgreSQL en tu Mac](https://www.youtube.com/watch?v=JYVnabdUp-0) y [Instalar PostgreSQL en macOS, rápido y fácil](https://www.youtube.com/watch?v=FtCS_3JuShA) |

Después de Postgres.app, agrega `psql` y `createdb` a la Terminal (copia y pega, pide tu clave del Mac):

```bash
sudo mkdir -p /etc/paths.d && echo /Applications/Postgres.app/Contents/Versions/16/bin | sudo tee /etc/paths.d/postgresapp
```

Cierra y vuelve a abrir la Terminal, y comprueba con `psql --version`.

**No necesitas** Homebrew, Docker, React, Vite, Tailwind ni Express: las dependencias del proyecto se instalan solas con `npm install`.

**Cuentas:** GitHub (una por integrante), Jira (ya la tienes) y, para el Ciclo 2, Mercado Pago Developers.

**Extensiones de VS Code** (opcionales; ESLint y Prettier se configuran en el Ciclo 3): Tailwind CSS IntelliSense, Prettier, ESLint.

## 2. Abrir el proyecto y ejecutarlo (25 a 40 minutos)

1. Descomprime `conexsur_proyecto.zip`. En VS Code: *File → Open Folder…* y elige la carpeta `conexsur`.
2. Abre la terminal integrada con ``Ctrl + ` `` (control y la tecla de acento grave).
3. Crea las dos bases de datos (Postgres.app debe estar corriendo):

   ```bash
   createdb conexsur
   createdb conexsur_test
   whoami                           # anota tu usuario del Mac
   ```

4. Configura la API:

   ```bash
   cd server
   cp .env.example .env
   cp .env.test.example .env.test
   ```

   Abre `server/.env` y cambia dos líneas (Postgres.app no usa clave en conexiones locales):
   - `DATABASE_URL=postgresql://TU_USUARIO@localhost:5432/conexsur` (el usuario que mostró `whoami`)
   - `JWT_SECRETO=` pega el resultado de `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

   En `server/.env.test` cambia solo `DATABASE_URL=postgresql://TU_USUARIO@localhost:5432/conexsur_test`.

5. Instala, crea las tablas, carga datos de demostración y arranca la API:

   ```bash
   npm install
   npm run migrar
   npm run semilla
   npm run dev                      # API en http://localhost:3000
   ```

6. Abre una **segunda terminal** (botón **+** del panel de terminal) y arranca el cliente:

   ```bash
   cd client
   npm install
   npm run dev                      # Aplicación en http://localhost:5173
   ```

7. Abre `http://localhost:5173` (con `localhost`, no `127.0.0.1`). Usuarios de demostración, todos con clave `Demo1234!`:
   - `admin@conexsur.cl`: administrador (resumen, clientes, calendario)
   - `tecnico@conexsur.cl`: técnico (su agenda)
   - `cliente@conexsur.cl`: cliente (portal móvil)

8. En la primera terminal (detén la API con `Ctrl + C` si quieres) ejecuta `npm test`. Deben salir 27 pruebas aprobadas.

**Problemas frecuentes**
- *`command not found: node` o `psql`*: cierra y abre de nuevo la Terminal y VS Code.
- *`role "..." does not exist`*: el usuario de `DATABASE_URL` no es el de `whoami`.
- *`connection refused` a PostgreSQL*: abre Postgres.app y pulsa *Start*.
- *«Origen no permitido» al iniciar sesión*: abriste el sitio con `127.0.0.1`; usa `localhost`.
- *Volver a los datos de demostración*: en `server`, `npm run semilla -- --limpiar`.

## 3. Subir el código a GitHub (20 a 30 minutos)

Videos: [Subir un proyecto local a GitHub desde VS Code en menos de 6 minutos](https://www.youtube.com/watch?v=2hcjEB-Mn7M) y [Conectar VS Code con GitHub desde cero](https://www.youtube.com/watch?v=lD6L0YqBS5w).

1. Cada integrante tiene su cuenta en github.com. Uno crea el repositorio y agrega al otro en *Settings → Collaborators*.
2. Identidad **real** en Git (así los commits quedan a tu nombre). En la Terminal:

   ```bash
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu-correo@duocuc.cl"
   ```

3. Camino más simple: en VS Code abre el ícono *Source Control* → **Initialize Repository** → revisa que en la lista de cambios **no** aparezcan `.env` ni `node_modules` → escribe un mensaje ("Base del proyecto: API, esquema y cliente") → **Commit** → **Publish Branch** → inicia sesión con GitHub en el navegador → elige repositorio **privado**.
4. Para cada historia nueva, usa una rama y un Pull Request revisado por la otra persona (parte de la Definición de terminado):

   ```bash
   git checkout -b feature/hu-14-pago-mercadopago
   git add . && git commit -m "HU-14: crear preferencia de pago en el servidor"
   git push -u origin feature/hu-14-pago-mercadopago
   ```

Regla de oro: `.env` y `.env.test` nunca se suben (el `.gitignore` ya los excluye). Si se sube una clave por error, se cambia de inmediato.

## 4. Tablero de Jira: dejarlo igual que los Word (20 a 30 minutos)

Videos: [Configura tu tablero en Jira](https://www.youtube.com/watch?v=Ez52IPHrrOY), [Cómo crear una columna en un tablero Jira](https://www.youtube.com/watch?v=1pPhicT2mJA) y [Cómo aplicar los límites WIP en Jira](https://www.youtube.com/watch?v=lf2Vc0N0gxU).

El Word dice que el tablero es la fuente vigente, así que el tablero debe mostrar este estado. Si ya cargaste las 21 historias, solo hay que moverlas; no vuelvas a importar el CSV (duplicaría tarjetas).

| Columna | Historias |
|---|---|
| Backlog | HU-02, 05, 06, 10, 11, 16, 17, 18, 19, 20, 21 |
| Seleccionado | HU-14, HU-15 |
| En Progreso (máx. 2) | vacía |
| Pruebas (QA) | HU-01, 03, 04, 07, 08, 09, 12, 13 |
| Terminado | vacía |

1. Columnas con esos nombres: en el tablero, *Configuración del tablero → Columnas* (el menú puede variar según la versión de Jira).
2. Límite de WIP: en la misma pantalla, restricción máxima de **2** para En Progreso.
3. Las tareas del Ciclo 1 (sección 12 del Word) van como subtareas dentro de cada historia. Las de HU-14, HU-15 y HU-21 se desglosan cuando empiece su ciclo.
4. No muevas tarjetas a Terminado para simular avance: Jira guarda la fecha de cada cambio. Una tarjeta pasa a Terminado cuando la otra persona la revisó y la aprobó.
5. Para la entrega: captura de pantalla del tablero completo, una por día.

## 5. Daily (15 minutos, mañana mismo)

Reunión corta de verdad —llamada o en persona— y registren lo que realmente dijeron. Tres preguntas: ¿qué se terminó desde la última vez?, ¿qué se hará hasta la próxima?, ¿qué bloquea el avance? Revisen además cuántas tarjetas hay en En Progreso.

Anótenlo en la tabla de la sección 13 del documento de gestión (fecha, terminado, a hacer, bloqueos, WIP, tarjetas) con la captura del tablero del día. El registro parte el 13 de octubre de 2026, como dice el documento. No se completan fechas anteriores: el registro es evidencia de lo que pasó y puede contrastarse con el tablero y los commits de GitHub.

## 6. Cómo explicar el código en la presentación (unas 2 horas por persona)

El proyecto usa la pila aprobada por la docente (React, Tailwind, Node/Express, PostgreSQL). Lo que importa es que **ustedes lo entiendan y lo puedan defender**. Recorran el código en este orden:

1. `server/db/001_schema.sql`: tablas y restricciones (en especial `visitas_sin_cruce` y los índices únicos de pagos).
2. `server/src/app.js` y `server/src/middlewares/`: por dónde pasa cada solicitud.
3. `server/src/modulos/auth/`: login, hash con scrypt, bloqueo por intentos, cookie httpOnly.
4. `server/src/modulos/visitas/`: cálculo de franjas libres y cómo se evita que dos clientes tomen la misma.
5. `client/src/App.jsx`, `contexto/AuthContexto.jsx` y `componentes/RutaProtegida.jsx`: rutas por rol.
6. `client/src/paginas/portal/NuevaVisita.jsx` y `componentes/CalendarioSemanal.jsx`.

Preguntas para ensayar con sus propias palabras:
- ¿Por qué la sesión va en una cookie httpOnly y no en localStorage?
- ¿Qué pasa si dos clientes piden el último horario al mismo tiempo?
- ¿Cómo se evita que un técnico tenga dos visitas a la misma hora?
- ¿Por qué el monto del pago lo define el servidor y no el navegador?
- ¿Por qué hay capas (ruta, controlador, servicio, repositorio)?
- ¿Qué hace cada prueba automática y cómo se ejecutan?

Si el curso tiene política sobre el uso de herramientas de IA, revísenla y declaren el apoyo como ahí se pida.

## 7. Plan de mañana (miércoles 14 de octubre)

| Bloque | Duración |
|---|---|
| Instalar los 4 programas (sección 1) | 40 a 60 min |
| Ejecutar el sistema y `npm test` (sección 2) | 25 a 40 min |
| Subir a GitHub (sección 3) | 20 a 30 min |
| Ajustar el tablero de Jira (sección 4) | 20 a 30 min |
| Recorrer el código (sección 6) | 2 a 3 h |
| Revisión cruzada: probar los módulos del otro | 1 a 1,5 h |
| Daily y captura del tablero | 20 min |
| Completar los campos amarillos de los Word | 30 a 45 min |
| Revisión final de los Word y ensayo del video | 45 a 60 min |
| **Total por persona** | **6,5 a 9,5 h** |

Orden sugerido: instalar y ejecutar primero (así se detectan problemas temprano), después GitHub y Jira, y dejar la tarde para leer código y revisar. El jueves en la mañana queda para el cierre y la entrega. Si Tomás hace en paralelo la parte de Jira y los campos de los Word, el total para cada uno baja a unas 5 a 7 horas.

## 8. Lo que viene

**Ciclo 2 (hasta el 30 de octubre): pagos con Mercado Pago**
1. Crear cuenta en *Mercado Pago Developers* → *Tus integraciones* → aplicación con *Checkout Pro*.
2. Copiar el **Access Token de prueba** a `MP_ACCESS_TOKEN` y definir `MP_WEBHOOK_SECRETO`.
3. Crear usuarios de prueba (comprador y vendedor) desde el panel.
4. Para recibir el webhook en el computador hace falta una URL pública temporal (por ejemplo `cloudflared` o `ngrok`).
5. Implementar el módulo `pagos` con el mismo patrón que `visitas`, siguiendo el flujo de la sección 14.7 del documento de arquitectura.

**Ciclo 3 (2 al 13 de noviembre):** despliegue con Docker Compose en un servidor, HTTPS, respaldo diario de la base, prueba de aceptación con CONEXSUR (HU-21), ESLint y Prettier, y video final.
