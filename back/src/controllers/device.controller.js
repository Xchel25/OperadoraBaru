const prisma = require("../config/database");

const INCLUDE_USER = {
  user: { select: { id: true, name: true, email: true, role: true } },
};

// GET /api/devices — lista todos (solo PM y RRHH)
async function listAll(req, res, next) {
  try {
    const devices = await prisma.deviceToken.findMany({
      include: INCLUDE_USER,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    res.json(devices);
  } catch (err) { next(err); }
}

// GET /api/devices/pending — solo pendientes
async function listPending(req, res, next) {
  try {
    const devices = await prisma.deviceToken.findMany({
      where: { status: "PENDING" },
      include: INCLUDE_USER,
      orderBy: { createdAt: "desc" },
    });
    res.json(devices);
  } catch (err) { next(err); }
}

// PUT /api/devices/:id/approve
async function approve(req, res, next) {
  try {
    const device = await prisma.deviceToken.update({
      where: { id: req.params.id },
      data:  { status: "APPROVED" },
      include: INCLUDE_USER,
    });
    res.json(device);
  } catch (err) { next(err); }
}

// PUT /api/devices/:id/reject
async function reject(req, res, next) {
  try {
    const device = await prisma.deviceToken.update({
      where: { id: req.params.id },
      data:  { status: "REJECTED" },
      include: INCLUDE_USER,
    });
    res.json(device);
  } catch (err) { next(err); }
}

// DELETE /api/devices/:id — eliminar registro
async function remove(req, res, next) {
  try {
    await prisma.deviceToken.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listAll, listPending, approve, reject, remove };
