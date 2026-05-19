const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    // Fire-and-forget: registrar última actividad sin bloquear el request
    prisma.user.update({
      where: { id: req.user.id },
      data: { lastActivityAt: new Date() },
    }).catch(() => {});
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Sin permisos para esta acción" });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
