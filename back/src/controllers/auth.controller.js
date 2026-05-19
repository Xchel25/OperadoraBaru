const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

// Round 0: 3 intentos → 5 min | Round 1: 1 intento → 10 min | Round 2: 1 intento → permanente
const MAX_ATTEMPTS_PER_ROUND = [3, 1, 1];
const LOCK_DURATIONS_MS      = [5 * 60 * 1000, 10 * 60 * 1000];

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // No revelar si el usuario existe o no
    if (!user || !user.active) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Bloqueo permanente
    if (user.lockedPermanent) {
      return res.status(403).json({
        error: "Cuenta bloqueada permanentemente. Contacta a RRHH para restablecer el acceso.",
        permanent: true,
      });
    }

    // Bloqueo temporal activo
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingSecs = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000);
      const mins = Math.ceil(remainingSecs / 60);
      return res.status(429).json({
        error: `Cuenta bloqueada. Intenta de nuevo en ${mins} minuto${mins !== 1 ? "s" : ""}.`,
        lockUntil: user.lockUntil,
      });
    }

    // Bloqueo temporal expirado — reset del contador del round
    if (user.lockUntil && user.lockUntil <= new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockUntil: null },
      });
      user.loginAttempts = 0;
      user.lockUntil = null;
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      const round    = user.lockRound;
      const maxForRound = MAX_ATTEMPTS_PER_ROUND[round] ?? 1;
      const attempts = user.loginAttempts + 1;

      if (attempts >= maxForRound) {
        const nextRound = round + 1;

        if (nextRound <= LOCK_DURATIONS_MS.length) {
          const duration  = LOCK_DURATIONS_MS[nextRound - 1];
          const lockUntil = new Date(Date.now() + duration);
          const mins      = duration / 60000;

          await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0, lockRound: nextRound, lockUntil },
          });

          return res.status(429).json({
            error: `Demasiados intentos fallidos. Cuenta bloqueada por ${mins} minutos.`,
            lockUntil,
          });
        } else {
          // Bloqueo permanente
          await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0, lockedPermanent: true, lockUntil: null },
          });

          return res.status(403).json({
            error: "Tu cuenta ha sido bloqueada por múltiples intentos fallidos.",
            permanent: true,
          });
        }
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: attempts },
        });

        const remaining = maxForRound - attempts;
        return res.status(401).json({
          error: `Credenciales incorrectas. ${remaining === 1 ? "Te queda" : "Te quedan"} ${remaining} intento${remaining !== 1 ? "s" : ""}.`,
          attemptsRemaining: remaining,
        });
      }
    }

    // ── Verificación de dispositivo ──────────────────────────────────
    const { fingerprint, deviceLabel } = req.body;

    if (fingerprint) {
      let device = await prisma.deviceToken.findUnique({
        where: { userId_fingerprint: { userId: user.id, fingerprint } },
      });

      if (!device) {
        // Primer dispositivo del usuario → aprobar automático
        // Dispositivo nuevo de usuario con dispositivos aprobados → pendiente
        const approvedCount = await prisma.deviceToken.count({
          where: { userId: user.id, status: "APPROVED" },
        });
        const status = approvedCount === 0 ? "APPROVED" : "PENDING";

        device = await prisma.deviceToken.create({
          data: { userId: user.id, fingerprint, label: deviceLabel || "Dispositivo desconocido", status },
        });

        if (status === "PENDING") {
          return res.status(403).json({
            error: "DEVICE_PENDING",
            message: "Este dispositivo aún no está autorizado. RRHH recibirá la solicitud y te avisará cuando puedas acceder.",
          });
        }
      } else if (device.status === "PENDING") {
        return res.status(403).json({
          error: "DEVICE_PENDING",
          message: "Tu solicitud está en revisión. RRHH te avisará cuando tu dispositivo sea aprobado.",
        });
      } else if (device.status === "REJECTED") {
        return res.status(403).json({
          error: "DEVICE_REJECTED",
          message: "Este dispositivo fue rechazado. Contacta a RRHH para más información.",
        });
      }

      // Actualizar última vez visto
      await prisma.deviceToken.update({
        where: { id: device.id },
        data:  { lastSeenAt: new Date() },
      });
    }

    // Éxito — resetear contadores y registrar login
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockUntil: null, lockRound: 0, lastLoginAt: new Date(), lastActivityAt: new Date() },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, firstLogin: user.firstLogin },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, active: true, firstLogin: true },
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.firstLogin) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: "Contraseña actual incorrecta" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed, firstLogin: false },
    });

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me, changePassword };
