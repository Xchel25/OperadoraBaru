const prisma = require("../config/database");

async function getAll(req, res, next) {
  try {
    const reports = await prisma.report.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, type } = req.body;
    const report = await prisma.report.create({
      data: { title, type, generatedBy: req.user.id },
      include: { user: { select: { name: true } } },
    });
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await prisma.report.delete({ where: { id: req.params.id } });
    res.json({ message: "Reporte eliminado" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, remove };
