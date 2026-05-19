const prisma = require("../config/database");

// CURSOS
async function getCourses(req, res, next) {
  try {
    const [courses, totalUsers] = await Promise.all([
      prisma.course.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        include: { progresses: { select: { progress: true } } },
      }),
      prisma.user.count({ where: { active: true } }),
    ]);

    const result = courses.map(({ progresses, ...c }) => ({
      ...c,
      stats: {
        started:   progresses.filter(p => p.progress > 0).length,
        completed: progresses.filter(p => p.progress >= 100).length,
        total:     totalUsers,
      },
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

function toArr(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

async function createCourse(req, res, next) {
  try {
    const { title, instructor, description, category, mandatory, videoUrl, attachmentUrl, targetRoles, targetEmails } = req.body;
    const finalVideoUrl      = req.files?.videoFile?.[0]      ? `/uploads/${req.files.videoFile[0].filename}`      : videoUrl      || null;
    const finalAttachmentUrl = req.files?.attachmentFile?.[0] ? `/uploads/${req.files.attachmentFile[0].filename}` : attachmentUrl || null;
    const course = await prisma.course.create({
      data: {
        title, instructor, description, category,
        mandatory: mandatory === true || mandatory === "true",
        videoUrl:      finalVideoUrl,
        attachmentUrl: finalAttachmentUrl,
        targetRoles:  toArr(targetRoles),
        targetEmails: toArr(targetEmails),
      },
    });
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
}

async function updateCourse(req, res, next) {
  try {
    const { title, instructor, description, category, mandatory, videoUrl, attachmentUrl, targetRoles, targetEmails } = req.body;
    const data = {};
    if (title !== undefined)         data.title = title;
    if (instructor !== undefined)    data.instructor = instructor;
    if (description !== undefined)   data.description = description;
    if (category !== undefined)      data.category = category;
    if (mandatory !== undefined)     data.mandatory = mandatory === true || mandatory === "true";
    if (req.files?.videoFile?.[0])        data.videoUrl      = `/uploads/${req.files.videoFile[0].filename}`;
    else if (videoUrl !== undefined)      data.videoUrl      = videoUrl || null;
    if (req.files?.attachmentFile?.[0])   data.attachmentUrl = `/uploads/${req.files.attachmentFile[0].filename}`;
    else if (attachmentUrl !== undefined) data.attachmentUrl = attachmentUrl || null;
    if (targetRoles !== undefined)   data.targetRoles  = toArr(targetRoles);
    if (targetEmails !== undefined)  data.targetEmails = toArr(targetEmails);
    const course = await prisma.course.update({ where: { id: req.params.id }, data });
    res.json(course);
  } catch (err) {
    next(err);
  }
}

async function deleteCourse(req, res, next) {
  try {
    await prisma.course.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ message: "Curso desactivado" });
  } catch (err) {
    next(err);
  }
}

// PROGRESO
async function getMyProgress(req, res, next) {
  try {
    const progresses = await prisma.courseProgress.findMany({
      where: { userId: req.user.id },
      include: { course: true },
    });
    res.json(progresses);
  } catch (err) {
    next(err);
  }
}

async function updateProgress(req, res, next) {
  try {
    const { courseId, progress } = req.body;
    const record = await prisma.courseProgress.upsert({
      where: { userId_courseId: { userId: req.user.id, courseId } },
      update: {
        progress,
        completedAt: progress >= 100 ? new Date() : null,
      },
      create: {
        userId: req.user.id,
        courseId,
        progress,
        completedAt: progress >= 100 ? new Date() : null,
      },
    });
    res.json(record);
  } catch (err) {
    next(err);
  }
}

module.exports = { getCourses, createCourse, updateCourse, deleteCourse, getMyProgress, updateProgress };
