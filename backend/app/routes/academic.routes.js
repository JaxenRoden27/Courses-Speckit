import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";
import db from "../models/index.js";
import logger from "../config/logger.js";

const router = Router();

const enrollmentMetadata = new Map();

// GET /course-t4/academic/students/:studentId/courses
router.get("/students/:studentId/courses", [authenticate], async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    if (Number.isNaN(studentId)) {
      return res.status(400).send({ message: "Invalid student id." });
    }

    const student = await db.user.findByPk(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).send({ message: `Student with id=${studentId} not found.` });
    }

    const enrollments = await db.enrollment.findAll({
      where: { studentId },
      order: [
        ["sectionId", "ASC"],
        ["id", "ASC"],
      ],
    });

    const [sections, courses, semesters] = await Promise.all([
      db.section.findAll(),
      db.course.findAll(),
      db.semester.findAll(),
    ]);

    const result = enrollments.map((e) => {
      const section = sections.find((s) => s.id === e.sectionId);
      const course = courses.find((c) => c.id === section?.courseId);
      const semester = semesters.find((sm) => sm.id === e.semesterId);

      const scheduleText = section
        ? `${section.daysOfWeek || ""} ${section.startTime || ""} - ${section.endTime || ""}`.trim()
        : "";

      const meta = enrollmentMetadata.get(e.id) || {};

      return {
        id: e.id,
        studentId: e.studentId,
        sectionId: e.sectionId,
        semesterId: e.semesterId,
        term:
          meta.term ||
          semester?.semester ||
          semester?.semesterName ||
          semester?.name ||
          `Semester ${e.semesterId}`,
        schedule:
          meta.schedule ||
          scheduleText ||
          (section?.sectionNumber ? `Section ${section.sectionNumber}` : ""),
        room: meta.room !== undefined ? meta.room : "",
        courseCode:
          meta.courseCode ||
          course?.courseNumber ||
          `Course ${course?.id || ""}`,
        courseTitle:
          meta.courseTitle ||
          course?.courseName ||
          "",
        credits: meta.credits !== undefined ? meta.credits : (course?.courseHours ?? ""),
        grade: meta.grade !== undefined ? meta.grade : "",
      };
    });

    return res.send(result);
  } catch (err) {
    logger.error(`academic getStudentCourses failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch student courses." });
  }
});

// POST /course-t4/academic/students/:studentId/courses
router.post("/students/:studentId/courses", [authenticate], async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    if (Number.isNaN(studentId)) {
      return res.status(400).send({ message: "Invalid student id." });
    }

    const student = await db.user.findByPk(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).send({ message: "Student not found." });
    }

    const { term, schedule, courseCode, courseTitle, credits, grade, room, sectionId, semesterId } = req.body;

    let targetSemesterId = semesterId ? parseInt(semesterId, 10) : null;
    let targetSectionId = sectionId ? parseInt(sectionId, 10) : null;

    if (!targetSemesterId && term) {
      const semester =
        (await db.semester.findOne({
          where: db.Sequelize.or({ semester: term }, { semesterName: term }),
        })) || (await db.semester.findOne());
      if (semester) targetSemesterId = semester.id;
    } else if (!targetSemesterId) {
      const firstSemester = await db.semester.findOne();
      if (firstSemester) targetSemesterId = firstSemester.id;
    }

    if (!targetSectionId && (courseCode || courseTitle)) {
      const course = await db.course.findOne({
        where: courseCode ? { courseNumber: courseCode } : { courseName: courseTitle },
      });
      if (course) {
        const section = await db.section.findOne({ where: { courseId: course.id } });
        if (section) targetSectionId = section.id;
      }
    }

    if (!targetSectionId) {
      const firstSection = await db.section.findOne();
      if (firstSection) targetSectionId = firstSection.id;
    }

    if (!targetSemesterId || !targetSectionId) {
      return res.status(400).send({ message: "Section or semester not found." });
    }

    const existing = await db.enrollment.findOne({
      where: { studentId, sectionId: targetSectionId },
    });
    if (existing) {
      return res.status(400).send({ message: "Enrollment already exists." });
    }

    const created = await db.enrollment.create({
      studentId,
      sectionId: targetSectionId,
      semesterId: targetSemesterId,
    });

    const meta = {
      term: term || "Current Term",
      schedule: schedule || "Current Schedule",
      room: room || "",
      courseCode: courseCode || "Course",
      courseTitle: courseTitle || "Title",
      credits: credits !== undefined && credits !== null ? credits : "",
      grade: grade || "",
    };
    enrollmentMetadata.set(created.id, meta);

    return res.status(201).send({
      id: created.id,
      studentId: created.studentId,
      sectionId: created.sectionId,
      semesterId: created.semesterId,
      ...meta,
    });
  } catch (err) {
    logger.error(`academic enrollCourse failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to enroll course." });
  }
});

// PUT /course-t4/academic/enrollments/:enrollmentId
router.put("/enrollments/:enrollmentId", [authenticate], async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId, 10);
    const enrollment = await db.enrollment.findByPk(enrollmentId);
    if (!enrollment) {
      return res.status(404).send({ message: `Enrollment with id=${enrollmentId} not found.` });
    }

    const { term, schedule, courseCode, courseTitle, credits, grade, room } = req.body;
    const currentMeta = enrollmentMetadata.get(enrollmentId) || {};
    const updatedMeta = {
      ...currentMeta,
      ...(term !== undefined ? { term } : {}),
      ...(schedule !== undefined ? { schedule } : {}),
      ...(courseCode !== undefined ? { courseCode } : {}),
      ...(courseTitle !== undefined ? { courseTitle } : {}),
      ...(credits !== undefined ? { credits } : {}),
      ...(grade !== undefined ? { grade } : {}),
      ...(room !== undefined ? { room } : {}),
    };
    enrollmentMetadata.set(enrollmentId, updatedMeta);

    return res.send({
      ...enrollment.toJSON(),
      ...updatedMeta,
    });
  } catch (err) {
    logger.error(`academic updateEnrollment failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update enrollment." });
  }
});

// Also support PUT /course-t4/enrollments/:enrollmentId directly
router.put("/:enrollmentId", [authenticate], async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId, 10);
    const enrollment = await db.enrollment.findByPk(enrollmentId);
    if (!enrollment) {
      return res.status(404).send({ message: `Enrollment with id=${enrollmentId} not found.` });
    }

    const { term, schedule, courseCode, courseTitle, credits, grade, room } = req.body;
    const currentMeta = enrollmentMetadata.get(enrollmentId) || {};
    const updatedMeta = {
      ...currentMeta,
      ...(term !== undefined ? { term } : {}),
      ...(schedule !== undefined ? { schedule } : {}),
      ...(courseCode !== undefined ? { courseCode } : {}),
      ...(courseTitle !== undefined ? { courseTitle } : {}),
      ...(credits !== undefined ? { credits } : {}),
      ...(grade !== undefined ? { grade } : {}),
      ...(room !== undefined ? { room } : {}),
    };
    enrollmentMetadata.set(enrollmentId, updatedMeta);

    return res.send({
      ...enrollment.toJSON(),
      ...updatedMeta,
    });
  } catch (err) {
    logger.error(`academic updateEnrollment failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update enrollment." });
  }
});

export default router;
