const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // ─── USUARIOS DE PRUEBA (uno por rol) ────────────────────────────────────────
  const usuarios = [
    { name: "Administrador Barú",    email: "admin@operadorabaru.com",       password: "baru2025",    role: "PROJECT_MANAGER", firstLogin: false },
    { name: "Laura Mendoza",         email: "laura@operadorabaru.com",       password: "baru2025",    role: "ADMIN_AREA",      firstLogin: false },
    { name: "Carlos Reyes",          email: "carlos.rrhh@operadorabaru.com", password: "baru2025",    role: "RRHH",            firstLogin: false },
    { name: "Sofía Guerrero",        email: "sofia.com@operadorabaru.com",   password: "baru2025",    role: "COMUNICACION",    firstLogin: false },
    { name: "Juan Pérez",            email: "juan@operadorabaru.com",        password: "temporal123", role: "COLABORADOR",     firstLogin: true  },
  ];

  for (const u of usuarios) {
    const hashed = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, firstLogin: u.firstLogin },
      create: { name: u.name, email: u.email, password: hashed, role: u.role, firstLogin: u.firstLogin },
    });
    console.log(`Usuario listo: ${u.email} [${u.role}]`);
  }

  console.log("\n✅ Seed completado.");
  console.log("─────────────────────────────────────────────────────");
  console.log("Usuarios de acceso:");
  console.log("  PROJECT_MANAGER → admin@operadorabaru.com       / baru2025");
  console.log("  ADMIN_AREA      → laura@operadorabaru.com       / baru2025");
  console.log("  RRHH            → carlos.rrhh@operadorabaru.com / baru2025");
  console.log("  COMUNICACION    → sofia.com@operadorabaru.com   / baru2025");
  console.log("  COLABORADOR     → juan@operadorabaru.com        / temporal123 (firstLogin)");
  console.log("─────────────────────────────────────────────────────");
  console.log("Indicadores RSE: vacíos — ingresarlos desde la página Indicadores");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
