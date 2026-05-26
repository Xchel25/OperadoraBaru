const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../config/database");

const ACTIVITY_SELECT = {
  id: true, name: true, email: true, role: true,
  active: true, firstLogin: true, createdAt: true,
  lastLoginAt: true, lastActivityAt: true,
};

async function getAll(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: ACTIVITY_SELECT,
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: ACTIVITY_SELECT,
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, email, role } = req.body;

    // Genera contraseña temporal automáticamente — no se permite que el admin la elija
    const tempPassword = crypto.randomBytes(6).toString("hex"); // 12 chars hex
    const hashed = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || "COLABORADOR", firstLogin: true },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // tempPassword se devuelve solo en este 201 — no se vuelve a exponer
    res.status(201).json({ ...user, tempPassword });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { name, email, role, active } = req.body;
    const data = {};
    if (name !== undefined)   data.name   = name;
    if (email !== undefined)  data.email  = email;
    if (role !== undefined)   data.role   = role;
    if (active !== undefined) data.active = active;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.json({ message: "Usuario desactivado" });
  } catch (err) {
    next(err);
  }
}

async function getDesempeno(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, role: true,
        active: true, firstLogin: true, createdAt: true,
        lastLoginAt: true, lastActivityAt: true,
        progresses: {
          include: {
            course: {
              select: { id: true, title: true, mandatory: true, category: true, active: true }
            }
          }
        }
      }
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const allCourses = await prisma.course.findMany({
      where: { active: true },
      select: { id: true, title: true, mandatory: true, category: true }
    });

    res.json({ user, allCourses });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove, getDesempeno };
