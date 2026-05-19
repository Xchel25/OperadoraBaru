const KB = [
  /* ── Saludos ──────────────────────────────────────────────── */
  { keys: ["hola", "buenos", "buenas", "hey", "hi", "que tal", "qué tal"],
    resp: "¡Hola! Soy el asistente de BARÚ. Puedo ayudarte con contraseñas, cursos, indicadores, avisos, permisos y más. ¿En qué te ayudo?" },

  /* ── Plataforma general ─────────────────────────────────────── */
  { keys: ["qué es", "para qué sirve", "funcionalidades", "cómo funciona", "plataforma", "sistema"],
    resp: "La plataforma Operadora Barú tiene 5 módulos: 📚 Capacitación (cursos y formación), 📣 Comunicación (avisos y documentos), 📊 Indicadores RSE (sostenibilidad), 📈 Reportes y 👤 Usuarios. Lo que puedes ver depende de tu rol asignado." },

  /* ── Dashboard ──────────────────────────────────────────────── */
  { keys: ["dashboard", "inicio", "página principal", "resumen", "tarjeta"],
    resp: "El Dashboard es tu punto de partida. Muestra tus cursos en progreso, los últimos avisos y el estado de los indicadores RSE. Si es tu primera vez en el sistema, verás un tutorial de bienvenida." },

  /* ── Contraseña ─────────────────────────────────────────────── */
  { keys: ["contraseña", "password", "clave", "olvidé", "olvidaste", "recuperar", "cambiar clave"],
    resp: "Para cambiar tu contraseña ve a Configuración → Mi perfil → Cambiar contraseña. Si es tu primer acceso el sistema te lo pedirá automáticamente. Si la olvidaste, contacta a RRHH para recibir una clave temporal." },

  /* ── Cursos / Capacitación ──────────────────────────────────── */
  { keys: ["curso", "capacitacion", "capacitación", "formacion", "video del curso", "progreso", "material", "avance"],
    resp: "En Capacitación verás tus cursos asignados según tu rol. Haz clic en una tarjeta para abrir el detalle, ver el video y registrar tu progreso con los botones 0%–100%. El avance se guarda automáticamente." },

  /* ── Certificados ───────────────────────────────────────────── */
  { keys: ["certificado", "diploma", "constancia", "completar", "terminar curso", "completado"],
    resp: "Cuando registres un curso al 100% queda marcado como Completado ✓. Los certificados digitales están en desarrollo y estarán disponibles próximamente." },

  /* ── Comunicación / Avisos / Documentos ────────────────────── */
  { keys: ["aviso", "comunicacion", "comunicación", "documento", "descargar", "descarga", "publicar aviso"],
    resp: "En Comunicación encuentras avisos institucionales, documentos descargables y videos RSE. Los avisos urgentes muestran un punto rojo en la campana del topbar." },

  /* ── Indicadores RSE ─────────────────────────────────────────── */
  { keys: ["indicador", "semaforo", "semáforo", "rse", "sostenibilidad", "verde", "rojo", "amarillo", "ejes", "porcentaje"],
    resp: "Los Indicadores RSE tienen semáforo: 🟢 Óptimo (70%+), 🟡 En progreso (40–69%), 🔴 En riesgo (<40%). Presiona el ícono ℹ en cada eje para ver sus métricas detalladas." },

  /* ── 5 Ejes RSE por nombre ──────────────────────────────────── */
  { keys: ["gobernanza", "clientes", "comunidad", "trabajadores", "medio ambiente", "eje rse"],
    resp: "Los 5 ejes RSE de Operadora Barú son: 🏛 Gobernanza (cumplimiento y ética), 🤝 Clientes (NPS y satisfacción), 🌍 Comunidad (proyectos sociales), 👷 Trabajadores (clima laboral) y 🌱 Medio Ambiente (huella ecológica)." },

  /* ── Roles y permisos ───────────────────────────────────────── */
  { keys: ["rol", "permiso", "acceso", "módulo", "modulo", "página", "pagina", "no puedo ver", "no tengo acceso"],
    resp: "Tu acceso depende de tu rol. En Ayuda → 'Tu perfil en el sistema' verás exactamente qué puedes hacer. ¿Necesitas acceso a algo específico? Contacta a tu Project Manager o RRHH." },

  /* ── Reportes ────────────────────────────────────────────────── */
  { keys: ["reporte", "exportar", "excel", "pdf", "descargar reporte"],
    resp: "Los reportes están disponibles para Project Manager, Admin de Área y RRHH. Ve a la página Reporte y usa los botones de exportación para descargar en Excel o PDF." },

  /* ── Notificaciones ──────────────────────────────────────────── */
  { keys: ["notificacion", "notificación", "campana", "alerta", "badge", "punto rojo"],
    resp: "Las notificaciones aparecen en la campana del topbar. El punto rojo indica avisos urgentes sin leer. Puedes activar o desactivar cada tipo en Configuración → Notificaciones." },

  /* ── Topbar ──────────────────────────────────────────────────── */
  { keys: ["topbar", "barra superior", "acceso rapido", "accesos rápidos", "botones arriba"],
    resp: "Los accesos rápidos del topbar se activan/desactivan en Configuración → Interfaz → toggle 'Accesos rápidos del topbar'." },

  /* ── Mi perfil ───────────────────────────────────────────────── */
  { keys: ["perfil", "mis datos", "mi información", "nombre", "mi cuenta", "editar perfil"],
    resp: "Tu perfil está en Configuración → Mi perfil. Ahí ves tu nombre, email y rol. También puedes cambiar tu contraseña o cerrar sesión desde esa sección." },

  /* ── Apariencia / Tema ───────────────────────────────────────── */
  { keys: ["oscuro", "claro", "tema", "modo oscuro", "dark mode", "apariencia", "color fondo"],
    resp: "Puedes cambiar entre modo claro y oscuro en Configuración → Apariencia, o usando el botón de sol/luna en el topbar. El sistema recuerda tu preferencia." },

  /* ── Idioma ──────────────────────────────────────────────────── */
  { keys: ["idioma", "inglés", "ingles", "español", "language", "traducción"],
    resp: "Puedes cambiar el idioma en Configuración → Idioma y región. Están disponibles Español e Inglés. El cambio afecta todos los textos de navegación del sistema." },

  /* ── Error técnico ───────────────────────────────────────────── */
  { keys: ["error", "problema", "falla", "bug", "no funciona", "pantalla blanca", "cargando"],
    resp: "Para reportar un problema escribe a soporte@baru.com con descripción y captura de pantalla. Respondemos en menos de 24 horas. También puedes intentar recargar la página (F5)." },

  /* ── Cuenta bloqueada ────────────────────────────────────────── */
  { keys: ["bloqueada", "bloqueado", "bloqueo", "no puedo entrar", "cuenta bloqueada"],
    resp: "Si no puedes acceder, usa '¿Olvidaste tu contraseña?' en la pantalla de Login, o contacta a RRHH para recibir una clave temporal de acceso." },

  /* ── Gracias ─────────────────────────────────────────────────── */
  { keys: ["gracias", "listo", "perfecto", "ok", "entendido", "me ayudó", "excelente"],
    resp: "¡Con gusto! Si tienes más dudas aquí estaré 😊. También puedes revisar las preguntas frecuentes o escribirnos a soporte@baru.com." },
];

export function botReply(input) {
  const q = input.toLowerCase();
  for (const item of KB) {
    if (item.keys.some(k => q.includes(k))) return item.resp;
  }
  return "Hmm, no estoy seguro sobre eso. Intenta con palabras como: 'contraseña', 'cursos', 'indicadores', 'avisos' o 'permisos'. También puedes escribir a soporte@baru.com 📧";
}
