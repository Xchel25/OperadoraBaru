const prisma = require("../config/database");

async function getAll(req, res, next) {
  try {
    const { period, category } = req.query;
    const where = {};
    if (period)   where.period   = period;
    if (category) where.category = category;

    const indicadores = await prisma.indicador.findMany({
      where,
      orderBy: [{ period: "desc" }, { category: "asc" }],
    });
    res.json(indicadores);
  } catch (err) {
    next(err);
  }
}

async function getLatest(req, res, next) {
  try {
    // Último valor de cada categoría
    const categories = ["Gobernanza", "Clientes", "Comunidad", "Trabajadores", "Medio ambiente"];
    const results = await Promise.all(
      categories.map((cat) =>
        prisma.indicador.findFirst({
          where: { category: cat },
          orderBy: { createdAt: "desc" },
        })
      )
    );
    res.json(results.filter(Boolean));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { category, label, value, period } = req.body;
    const indicador = await prisma.indicador.create({
      data: { category, label, value: parseFloat(value), period },
    });
    res.status(201).json(indicador);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const indicador = await prisma.indicador.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(indicador);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await prisma.indicador.delete({ where: { id: req.params.id } });
    res.json({ message: "Indicador eliminado" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getLatest, create, update, remove };
