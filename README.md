# 🏢 Operadora Barú — Sistema de Gestión Empresarial

Sistema web completo para la gestión de operaciones empresariales de **Operadora Barú**. Incluye módulos de sostenibilidad, capacitación, comunicación interna, panel de desempeño de empleados e indicadores de rendimiento. Desplegado en producción con Vercel y Railway.

---

## 🌐 Demo en producción

🔗 **[operadora-baru.vercel.app](https://operadora-baru.vercel.app)**

---

## 🧰 Tecnologías utilizadas

### Frontend
- **React** + **Vite**
- JavaScript (ES6+)
- CSS / HTML

### Backend
- **Node.js** + **Express 5**
- **Prisma ORM** + **PostgreSQL**
- Autenticación JWT (jsonwebtoken + bcryptjs)
- Seguridad con **Helmet** + **CORS**
- Subida de archivos con **Multer**

### Infraestructura
- **Docker** + **docker-compose** (desarrollo local)
- **Vercel** (frontend — 21+ despliegues en producción)
- **Railway** (backend)

---

## 📁 Estructura del proyecto

```
OperadoraBaru/
├── back/
│   ├── src/
│   │   ├── controllers/     # auth, usuarios, capacitación, comunicación, indicadores, reportes
│   │   ├── middlewares/     # autenticación JWT
│   │   ├── routes/          # rutas de la API
│   │   └── config/          # configuración DB
│   ├── prisma/              # esquema y migraciones
│   ├── Dockerfile
│   └── package.json
├── front/
│   └── src/                 # Interfaz React
├── presentacion/            # Material de presentación del proyecto
└── docker-compose.yml
```

---

## ⚙️ Instalación y uso

### Con Docker (recomendado)

```bash
git clone https://github.com/Xchel25/OperadoraBaru.git
cd OperadoraBaru
docker-compose up --build
```

### Manual

#### Backend
```bash
cd back
npm install
cp .env.example .env
# Configura tu base de datos PostgreSQL en .env
npx prisma generate
npx prisma db push
node seed-demo.js
npm run dev
```

#### Frontend
```bash
cd front
npm install
npm run dev
```

---

## ✨ Módulos principales

- **Autenticación** — Login seguro con roles (admin / empleado)
- **Dashboard de empleados** — Panel de desempeño con calificación automática
- **Sostenibilidad** — Gestión de iniciativas de responsabilidad social
- **Capacitación** — Registro y seguimiento de cursos y formaciones
- **Comunicación interna** — Módulo de mensajes y notificaciones
- **Indicadores** — Métricas y KPIs de rendimiento
- **Reportes** — Generación y descarga de reportes
- **Gestión de dispositivos** — Control de activos tecnológicos

---

## 👤 Autor

**Xchel25** — [github.com/Xchel25](https://github.com/Xchel25)
