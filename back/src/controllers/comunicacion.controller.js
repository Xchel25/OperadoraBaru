const prisma = require("../config/database");
const path = require("path");

// AVISOS
async function getNotices(req, res, next) {
  try {
    const notices = await prisma.notice.findMany({
      where: { active: true },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(notices);
  } catch (err) {
    next(err);
  }
}

async function createNotice(req, res, next) {
  try {
    const { title, content, type } = req.body;
    const notice = await prisma.notice.create({
      data: { title, content, type: type || "info", authorId: req.user.id },
    });
    res.status(201).json(notice);
  } catch (err) {
    next(err);
  }
}

async function deleteNotice(req, res, next) {
  try {
    await prisma.notice.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ message: "Aviso eliminado" });
  } catch (err) {
    next(err);
  }
}

// DOCUMENTOS
async function getDocuments(req, res, next) {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibió archivo" });

    const doc = await prisma.document.create({
      data: {
        name: req.body.name || req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        category: req.body.category || "general",
      },
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

async function deleteDocument(req, res, next) {
  try {
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: "Documento eliminado" });
  } catch (err) {
    next(err);
  }
}

// VIDEOS RSE
async function getVideos(req, res, next) {
  try {
    const videos = await prisma.rseVideo.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(videos);
  } catch (err) {
    next(err);
  }
}

async function createVideo(req, res, next) {
  try {
    const { title, url } = req.body;
    if (!title) return res.status(400).json({ error: "El título es requerido" });
    const finalUrl = req.file ? `/uploads/${req.file.filename}` : url;
    if (!finalUrl) return res.status(400).json({ error: "Proporciona una URL o sube un archivo" });
    const video = await prisma.rseVideo.create({ data: { title, url: finalUrl } });
    res.status(201).json(video);
  } catch (err) {
    next(err);
  }
}

async function deleteVideo(req, res, next) {
  try {
    await prisma.rseVideo.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ message: "Video eliminado" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotices, createNotice, deleteNotice, getDocuments, uploadDocument, deleteDocument, getVideos, createVideo, deleteVideo };
