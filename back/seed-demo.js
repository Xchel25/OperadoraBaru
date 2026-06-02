/**
 * Seed de datos demo — Operadora Barú
 * Uso: DATABASE_URL="postgresql://..." node seed-demo.js
 *
 * Llena: Cursos, Progreso, Avisos, Documentos, Videos RSE, Indicadores (2 períodos)
 */

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function getAdmin() {
  const admin = await p.user.findFirst({ where: { role: "PROJECT_MANAGER" } });
  if (!admin) throw new Error("No hay admin (PROJECT_MANAGER) en la BD. Créalo primero.");
  return admin;
}

async function getAllUsers() {
  return p.user.findMany({ where: { active: true } });
}

// ─── 1. CURSOS DE CAPACITACIÓN ────────────────────────────────────────────────

const CURSOS = [
  {
    title: "Código de Ética y Conducta Corporativa",
    instructor: "Dirección General",
    description:
      "Conoce los principios éticos que guían a Operadora Barú: integridad, transparencia, respeto y compromiso con la legalidad. Curso obligatorio para todo el personal.",
    category: "Gobernanza",
    mandatory: true,
    videoUrl: "https://www.youtube.com/watch?v=BOksW_NabEk",
    targetRoles: [],
  },
  {
    title: "Seguridad e Higiene en el Trabajo",
    instructor: "Área de Seguridad Industrial",
    description:
      "Aprende las normas NOM vigentes, uso correcto de EPP, protocolos de evacuación y reporte de incidentes. Obligatorio para ingresar a áreas operativas.",
    category: "Trabajadores",
    mandatory: true,
    videoUrl: "https://www.youtube.com/watch?v=IXs6uP3-h5I",
    targetRoles: [],
  },
  {
    title: "Atención al Cliente de Excelencia",
    instructor: "Gerencia de Experiencia al Cliente",
    description:
      "Técnicas prácticas para escuchar activamente, resolver quejas de forma efectiva y superar las expectativas del cliente. Incluye casos reales de la industria de transporte.",
    category: "Clientes",
    mandatory: false,
    videoUrl: "https://www.youtube.com/watch?v=hvCIjd7zzPc",
    targetRoles: ["COLABORADOR", "ADMIN_AREA"],
  },
  {
    title: "Responsabilidad Ambiental Empresarial",
    instructor: "Coordinación de Sustentabilidad",
    description:
      "Descubre cómo Operadora Barú contribuye a la reducción de huella de carbono: eficiencia energética, gestión de residuos y movilidad sostenible. Incluye actividades prácticas.",
    category: "Medio ambiente",
    mandatory: false,
    videoUrl: "https://www.youtube.com/watch?v=B3E8PZmMFJQ",
    targetRoles: [],
  },
  {
    title: "Liderazgo Transformacional",
    instructor: "Consultora Talento Humano",
    description:
      "Desarrolla habilidades para inspirar equipos, gestionar el cambio y comunicar la visión estratégica. Basado en metodologías de liderazgo contemporáneo con énfasis en RSE.",
    category: "RRHH",
    mandatory: false,
    videoUrl: "https://www.youtube.com/watch?v=qp0HIF3SfI4",
    targetRoles: ["PROJECT_MANAGER", "ADMIN_AREA", "RRHH"],
  },
  {
    title: "Comunidad e Impacto Social",
    instructor: "Área de RSE",
    description:
      "Conoce los proyectos de vinculación comunitaria de Barú, cómo participar en voluntariados y medir el impacto social de nuestras acciones en las comunidades donde operamos.",
    category: "Comunidad",
    mandatory: false,
    videoUrl: "https://www.youtube.com/watch?v=VXyGBLuMkzE",
    targetRoles: [],
  },
];

// ─── 2. AVISOS DE COMUNICACIÓN ────────────────────────────────────────────────

const AVISOS = (authorId) => [
  {
    title: "🎉 Bienvenidos al Sistema RSE de Operadora Barú",
    content:
      "Con gran entusiasmo presentamos nuestra nueva plataforma digital de Responsabilidad Social Empresarial. Desde aquí podrás acceder a tus cursos de capacitación, revisar los indicadores RSE de la empresa, recibir comunicados oficiales y mucho más. Este sistema es el resultado de meses de trabajo colaborativo. ¡Explóralo y dinos tu opinión!",
    type: "info",
    authorId,
    createdAt: daysAgo(5),
  },
  {
    title: "⚠️ Recordatorio: Evaluaciones de Desempeño — Cierre 31 de Mayo",
    content:
      "Se informa a todo el personal que el período de evaluaciones de desempeño cierra el próximo 31 de mayo. Es indispensable que cada colaborador complete su autoevaluación y que los líderes de área finalicen las evaluaciones de sus equipos antes de esa fecha. El área de RRHH estará disponible para resolver dudas.",
    type: "warning",
    authorId,
    createdAt: daysAgo(3),
  },
  {
    title: "🔴 Actualización de Protocolo de Seguridad — Lectura Obligatoria",
    content:
      "En atención a las nuevas disposiciones de la NOM-030-STPS, se actualizó el protocolo de seguridad en todas las instalaciones. Los cambios incluyen: nuevas rutas de evacuación en planta norte, uso obligatorio de chaleco reflectante en patio de maniobras y reporte inmediato de condiciones inseguras al ext. 210. Favor de firmar el acuse de recibido con su coordinador de área.",
    type: "urgente",
    authorId,
    createdAt: daysAgo(2),
  },
  {
    title: "📊 Resultados Índice RSE — Primer Trimestre 2025",
    content:
      "Nos complace informar que el Índice RSE Global de Operadora Barú alcanzó 70.4 puntos en Q1-2025, un avance de +8.8 puntos respecto al trimestre anterior (61.6 pts). Destacan el eje de Gobernanza (81 pts, ↑9 pts) y Clientes (78 pts, ↑13 pts). El eje de Comunidad sigue siendo nuestra área de oportunidad (58 pts). ¡Gracias a todos por su compromiso!",
    type: "info",
    authorId,
    createdAt: daysAgo(1),
  },
  {
    title: "📚 Nuevos cursos disponibles en Capacitación",
    content:
      "Se han publicado 6 nuevos cursos en el módulo de Capacitación. Recuerda que 'Código de Ética' y 'Seguridad e Higiene' son de carácter obligatorio para todo el personal. Los cursos de 'Liderazgo Transformacional' y 'Atención al Cliente' están dirigidos a roles específicos. Accede a Capacitación y registra tu avance. ¡El aprendizaje continuo nos hace mejores!",
    type: "info",
    authorId,
    createdAt: daysAgo(0),
  },
];

// ─── 3. DOCUMENTOS ────────────────────────────────────────────────────────────

const DOCUMENTOS = [
  {
    name: "Manual de Responsabilidad Social Empresarial 2025",
    url: "https://drive.google.com/file/d/example-rse-manual/view",
    category: "politicas",
  },
  {
    name: "Código de Ética Corporativo — Versión Vigente",
    url: "https://drive.google.com/file/d/example-etica/view",
    category: "politicas",
  },
  {
    name: "Reporte de Sustentabilidad Anual 2024",
    url: "https://drive.google.com/file/d/example-reporte-2024/view",
    category: "reportes",
  },
  {
    name: "Política de Gestión Ambiental",
    url: "https://drive.google.com/file/d/example-ambiental/view",
    category: "politicas",
  },
];

// ─── 4. VIDEOS RSE ────────────────────────────────────────────────────────────

const VIDEOS_RSE = [
  {
    title: "¿Qué es la Responsabilidad Social Empresarial?",
    url: "https://www.youtube.com/watch?v=VXyGBLuMkzE",
  },
  {
    title: "Operadora Barú: Compromiso con la Comunidad",
    url: "https://www.youtube.com/watch?v=B3E8PZmMFJQ",
  },
  {
    title: "Movilidad Sostenible — El Futuro del Transporte",
    url: "https://www.youtube.com/watch?v=BOksW_NabEk",
  },
];

// ─── 5. INDICADORES RSE — 2 PERÍODOS ─────────────────────────────────────────

const INDICADORES = [
  // ── Q4-2024 (período anterior)
  { category: "Gobernanza",     label: "Cumplimiento normativo",        value: 72, period: "Q4-2024" },
  { category: "Clientes",       label: "Satisfacción del cliente",      value: 65, period: "Q4-2024" },
  { category: "Comunidad",      label: "Impacto en comunidades",        value: 45, period: "Q4-2024" },
  { category: "Trabajadores",   label: "Clima laboral",                 value: 68, period: "Q4-2024" },
  { category: "Medio ambiente", label: "Reducción de huella de carbono",value: 52, period: "Q4-2024" },

  // ── Q1-2025 (período actual — mejora visible en todos los ejes)
  { category: "Gobernanza",     label: "Cumplimiento normativo",        value: 81, period: "Q1-2025" },
  { category: "Clientes",       label: "Satisfacción del cliente",      value: 78, period: "Q1-2025" },
  { category: "Comunidad",      label: "Impacto en comunidades",        value: 58, period: "Q1-2025" },
  { category: "Trabajadores",   label: "Clima laboral",                 value: 74, period: "Q1-2025" },
  { category: "Medio ambiente", label: "Reducción de huella de carbono",value: 61, period: "Q1-2025" },
];

// ─── PROGRESO DE CURSOS ───────────────────────────────────────────────────────

// Admin = 100% en obligatorios, 75% en otros
// Revisores = varios niveles de progreso
const PROGRESOS_ADMIN = [
  { courseIndex: 0, progress: 100 }, // Código de Ética — completado
  { courseIndex: 1, progress: 100 }, // Seguridad — completado
  { courseIndex: 2, progress: 75  }, // Atención al Cliente
  { courseIndex: 3, progress: 50  }, // Medio Ambiente
  { courseIndex: 4, progress: 100 }, // Liderazgo — completado
  { courseIndex: 5, progress: 25  }, // Comunidad
];

const PROGRESOS_REVISORES = [
  // revisor1 (COLABORADOR)
  [100, 100, 50, 0, 0, 25],
  // revisor2 (COLABORADOR)
  [100, 75, 25, 0, 0, 0],
  // revisor3 (RRHH)
  [100, 100, 0, 50, 75, 50],
  // revisor4 (ADMIN_AREA)
  [100, 100, 75, 100, 50, 25],
  // revisor5 (COMUNICACION)
  [100, 100, 0, 75, 0, 100],
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Iniciando seed de datos demo — Operadora Barú\n");

  const admin = await getAdmin();
  const users = await getAllUsers();
  console.log(`👤 Admin: ${admin.email}`);
  console.log(`👥 Usuarios en BD: ${users.length}\n`);

  // 1. CURSOS
  console.log("📚 Creando cursos de capacitación...");
  const cursosCreados = [];
  for (const curso of CURSOS) {
    const exists = await p.course.findFirst({ where: { title: curso.title } });
    if (exists) {
      cursosCreados.push(exists);
      console.log(`   ⚠️  Ya existe: ${curso.title}`);
    } else {
      const created = await p.course.create({ data: curso });
      cursosCreados.push(created);
      console.log(`   ✅ ${curso.title}`);
    }
  }

  // 2. PROGRESO ADMIN
  console.log("\n📈 Registrando progreso del admin...");
  for (const { courseIndex, progress } of PROGRESOS_ADMIN) {
    const course = cursosCreados[courseIndex];
    if (!course) continue;
    await p.courseProgress.upsert({
      where: { userId_courseId: { userId: admin.id, courseId: course.id } },
      update: { progress, completedAt: progress === 100 ? new Date() : null },
      create: {
        userId: admin.id,
        courseId: course.id,
        progress,
        completedAt: progress === 100 ? new Date() : null,
      },
    });
    console.log(`   ✅ ${course.title}: ${progress}%`);
  }

  // 3. PROGRESO REVISORES
  const revisores = users.filter(u =>
    u.email.startsWith("revisor") && u.email.includes("@operadorabaru.com")
  ).sort((a, b) => a.email.localeCompare(b.email));

  if (revisores.length > 0) {
    console.log(`\n📈 Registrando progreso de ${revisores.length} revisores...`);
    for (let ri = 0; ri < revisores.length; ri++) {
      const revisor = revisores[ri];
      const progresos = PROGRESOS_REVISORES[ri] || [];
      for (let ci = 0; ci < cursosCreados.length; ci++) {
        const curso = cursosCreados[ci];
        const progress = progresos[ci] ?? 0;
        if (progress === 0) continue;
        await p.courseProgress.upsert({
          where: { userId_courseId: { userId: revisor.id, courseId: curso.id } },
          update: { progress, completedAt: progress === 100 ? new Date() : null },
          create: {
            userId: revisor.id,
            courseId: curso.id,
            progress,
            completedAt: progress === 100 ? new Date() : null,
          },
        });
      }
      console.log(`   ✅ ${revisor.name} — progreso registrado`);
    }
  }

  // 4. AVISOS
  console.log("\n📢 Creando avisos de comunicación...");
  for (const aviso of AVISOS(admin.id)) {
    const exists = await p.notice.findFirst({ where: { title: aviso.title } });
    if (exists) {
      console.log(`   ⚠️  Ya existe: ${aviso.title.substring(0, 50)}`);
    } else {
      await p.notice.create({ data: aviso });
      console.log(`   ✅ ${aviso.title.substring(0, 50)}...`);
    }
  }

  // 5. DOCUMENTOS
  console.log("\n📄 Creando documentos...");
  for (const doc of DOCUMENTOS) {
    const exists = await p.document.findFirst({ where: { name: doc.name } });
    if (exists) {
      console.log(`   ⚠️  Ya existe: ${doc.name}`);
    } else {
      await p.document.create({ data: doc });
      console.log(`   ✅ ${doc.name}`);
    }
  }

  // 6. VIDEOS RSE
  console.log("\n🎬 Creando videos RSE...");
  for (const video of VIDEOS_RSE) {
    const exists = await p.rseVideo.findFirst({ where: { title: video.title } });
    if (exists) {
      console.log(`   ⚠️  Ya existe: ${video.title}`);
    } else {
      await p.rseVideo.create({ data: video });
      console.log(`   ✅ ${video.title}`);
    }
  }

  // 7. INDICADORES RSE (2 períodos)
  console.log("\n📊 Creando indicadores RSE (Q4-2024 y Q1-2025)...");
  for (const ind of INDICADORES) {
    const exists = await p.indicador.findFirst({
      where: { category: ind.category, period: ind.period },
    });
    if (exists) {
      console.log(`   ⚠️  Ya existe: ${ind.category} — ${ind.period}`);
    } else {
      await p.indicador.create({ data: ind });
      console.log(`   ✅ ${ind.category} (${ind.period}): ${ind.value} pts`);
    }
  }

  // ─── RESUMEN ──────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("✅ SEED COMPLETADO — Resumen:");
  console.log("=".repeat(60));
  console.log(`📚 Cursos:      ${cursosCreados.length} (2 obligatorios, 4 opcionales)`);
  console.log(`📢 Avisos:      5 (1 urgente, 1 advertencia, 3 informativos)`);
  console.log(`📄 Documentos:  4`);
  console.log(`🎬 Videos RSE:  3`);
  console.log(`📊 Indicadores: 10 (5 ejes × 2 períodos — Q4-2024 y Q1-2025)`);
  console.log(`\n🌐 Visita: https://operadora-baru.vercel.app`);
  console.log(`🔑 Login:  admin@operadorabaru.com / Admin2026!\n`);
}

main()
  .catch((e) => { console.error("❌ Error:", e.message); process.exit(1); })
  .finally(() => p.$disconnect());
