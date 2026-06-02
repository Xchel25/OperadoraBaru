/**
 * Script: Crear 5 usuarios de demo directo en BD
 * Uso: DATABASE_URL="postgresql://..." node crear-usuarios-demo.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const p = new PrismaClient();

const USUARIOS = [
  { name: "Revisor 1", email: "revisor1@operadorabaru.com", role: "COLABORADOR"  },
  { name: "Revisor 2", email: "revisor2@operadorabaru.com", role: "COLABORADOR"  },
  { name: "Revisor 3", email: "revisor3@operadorabaru.com", role: "RRHH"         },
  { name: "Revisor 4", email: "revisor4@operadorabaru.com", role: "ADMIN_AREA"   },
  { name: "Revisor 5", email: "revisor5@operadorabaru.com", role: "COMUNICACION" },
];

async function main() {
  console.log("\n👥 Creando usuarios de demo...\n");
  const resultados = [];

  for (const u of USUARIOS) {
    const tempPassword = crypto.randomBytes(6).toString("hex"); // 12 chars
    const hashed = await bcrypt.hash(tempPassword, 10);
    try {
      const created = await p.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: hashed,
          role: u.role,
          active: true,
          firstLogin: true,
        },
      });
      resultados.push({ ...u, tempPassword });
      console.log(`✅ Creado: ${u.name} — ${u.email} (${u.role})`);
    } catch (e) {
      if (e.code === "P2002") {
        console.log(`⚠️  Ya existe: ${u.email} — omitido`);
      } else {
        console.error(`❌ Error con ${u.email}:`, e.message);
      }
    }
  }

  if (resultados.length === 0) {
    console.log("\n⚠️  Todos los usuarios ya existían.");
    console.log("   Si necesitas resetear contraseñas, elimínalos desde la plataforma y vuelve a correr este script.\n");
    return;
  }

  console.log("\n" + "=".repeat(62));
  console.log("📋 TARJETAS DE ACCESO — Envía por WhatsApp a cada persona");
  console.log("=".repeat(62));

  for (const u of resultados) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Plataforma RSE Operadora Barú
🌐 https://operadora-baru.vercel.app
👤 ${u.name}  |  Rol: ${u.role}
📧 ${u.email}
🔑 Contraseña temporal: ${u.tempPassword}
⚠️  Al entrar por primera vez debes crear tu contraseña
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  }

  console.log("\n🚨 GUARDA ESTAS CONTRASEÑAS — no se vuelven a mostrar.\n");
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
