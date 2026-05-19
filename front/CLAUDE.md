# baru-frontend

Sistema de gestión RSE (Responsabilidad Social Empresarial) — solo frontend por ahora.

## Stack exacto
- React 19 + Vite 8
- Tailwind CSS 3
- React Router DOM 7 (`BrowserRouter`)
- lucide-react (iconos principales)
- react-icons (iconos secundarios)
- Sin backend real — auth simulada con localStorage/ProtectedRoute

## Mapa de archivos clave

| Archivo | Propósito |
|---|---|
| `src/routes/AppRouter.jsx` | Todas las rutas de la app |
| `src/routes/ProtectedRoute.jsx` | Guard de autenticación |
| `src/layouts/DashboardLayout.jsx` | Layout principal con sidebar/navbar |
| `src/layouts/AuthLayout.jsx` | Layout para Login y Recuperar |
| `src/config/sidebarConfig.js` | Subitems del sidebar por ruta — ÚNICA fuente de verdad del menú |
| `src/pages/` | Una página por ruta (Dashboard, Capacitacion, etc.) |
| `src/components/` | Componentes reutilizables |
| `src/index.css` | Único lugar para CSS custom (Tailwind base aquí) |

## Páginas existentes
- `/` → Login
- `/recuperar` → Recuperar contraseña
- `/dashboard` → Dashboard principal
- `/capacitacion` → Módulo de capacitación
- `/comunicacion` → Comunicación interna
- `/indicadores` → Indicadores RSE (Gobernanza, Clientes, Comunidad, Trabajadores, Medio ambiente)
- `/reporte` → Reportes y exportación
- `/usuario` → Gestión de usuarios y roles
- `/configuracion` → Configuración de la app
- `/ayuda` → Centro de ayuda

## Componentes reutilizables disponibles
- `Button.jsx` — botón con variantes
- `Input.jsx` — input estilizado
- `Breadcrumbs.jsx` — navegación de migas
- `PageContainer.jsx` — wrapper de contenido de página
- `ThemeToggle.jsx` — toggle claro/oscuro

## Cómo agregar una nueva página
1. Crear `src/pages/NuevaPagina.jsx`
2. Agregar ruta en `src/routes/AppRouter.jsx`
3. Agregar entrada en `src/config/sidebarConfig.js` si tiene subitems
4. NO modificar `DashboardLayout.jsx` salvo que sea estrictamente necesario

## Convenciones estrictas
- Componentes y páginas: `PascalCase`
- Estilos: solo Tailwind — no crear archivos `.css` nuevos
- CSS custom únicamente en `src/index.css`
- Iconos: preferir `lucide-react`; `react-icons` solo si no existe en lucide
- No crear carpetas nuevas en `src/` sin necesidad real
- No agregar dependencias sin confirmación explícita

## Cómo usar Claude Code eficientemente en este proyecto

### Buenos prompts (específicos, bajo costo de tokens)
- "en `src/pages/Dashboard.jsx` agrega una card con título 'Ventas' y valor '0', usando Tailwind, sin tocar otros archivos"
- "en `src/config/sidebarConfig.js` agrega el subitem 'Historial' con icono Clock a la ruta /comunicacion"
- "en `src/components/Button.jsx` agrega una variante `danger` con fondo rojo"
- "en `src/layouts/DashboardLayout.jsx` línea X, cambia el color del sidebar de slate-800 a zinc-900"

### Malos prompts (vagos, gastan tokens)
- "arregla el dashboard"
- "mejora el diseño"
- "agrega funcionalidad al sidebar"

## Comandos
```bash
npm run dev      # servidor local http://localhost:5173
npm run build    # build de producción
npm run lint     # verificar errores ESLint
npm run preview  # previsualizar build
```

## Restricciones importantes
- No conectar a backend real sin confirmación — la auth es simulada
- No instalar librerías de UI externas (shadcn, MUI, etc.) sin pedirlo
- No modificar `vite.config.js`, `tailwind.config.js` o `eslint.config.js` salvo instrucción explícita
- Confirmar antes de refactorizar más de un archivo a la vez
