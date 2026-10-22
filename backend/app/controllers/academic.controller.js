import db from "../models/index.js";
import logger from "../config/logger.js";

const enrollmentMetadata = new Map();

const getStudentCourses = async (req, res) => {
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
};

const enrollStudentCourse = async (req, res) => {
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
      const allSemesters = await db.semester.findAll();
      const semester =
        allSemesters.find((s) => s.semester === term || term?.includes(s.semester) || s.semester?.includes(term)) ||
        allSemesters[0];
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
};

const updateEnrollment = async (req, res) => {
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
};

const getSections = async (req, res) => {
  try {
    const sections = await db.section.findAll({
      include: [
        {
          model: db.course,
          as: "course",
          attributes: ["id", "courseName", "courseNumber"],
        },
        {
          model: db.faculty,
          as: "faculty",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [
        [{ model: db.course, as: "course" }, "courseName", "ASC"],
        ["sectionNumber", "ASC"],
      ],
    });
    return res.send(sections);
  } catch (err) {
    logger.error(`academic getSections failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch sections." });
  }
};

const getSectionStudents = async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId, 10);
    if (Number.isNaN(sectionId)) {
      return res.status(400).send({ message: "Invalid section id." });
    }

    const section = await db.section.findByPk(sectionId);
    if (!section) {
      return res.status(404).send({ message: `Section with id=${sectionId} not found.` });
    }

    const enrollments = await db.enrollment.findAll({
      where: { sectionId },
      include: [
        {
          model: db.user,
          as: "student",
          attributes: ["id", "fName", "lName", "email", "universityId"],
        },
      ],
      order: [["id", "ASC"]],
    });

    const result = enrollments.map((e) => {
      const student = e.student || {};
      return {
        id: e.id,
        enrollmentId: e.id,
        studentId: e.studentId,
        sectionId: e.sectionId,
        semesterId: e.semesterId,
        firstName: student.fName || "",
        lastName: student.lName || "",
        fName: student.fName || "",
        lName: student.lName || "",
        universityId: student.universityId || `U${student.id || ""}`,
        email: student.email || "",
      };
    });

    return res.send(result);
  } catch (err) {
    logger.error(`academic getSectionStudents failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch section students." });
  }
};

const enrollSectionStudent = async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId, 10);
    if (Number.isNaN(sectionId)) {
      return res.status(400).send({ message: "Invalid section id." });
    }

    const section = await db.section.findByPk(sectionId);
    if (!section) {
      return res.status(404).send({ message: `Section with id=${sectionId} not found.` });
    }

    const studentId = req.body.studentId ? parseInt(req.body.studentId, 10) : NaN;
    if (Number.isNaN(studentId)) {
      return res.status(400).send({ message: "Required" });
    }

    const student = await db.user.findByPk(studentId);
    if (!student) {
      return res.status(404).send({ message: "Student not found." });
    }

    const existing = await db.enrollment.findOne({
      where: { studentId, sectionId },
    });
    if (existing) {
      return res.status(400).send({ message: "Student is already enrolled in this section." });
    }

    let semesterId = req.body.semesterId ? parseInt(req.body.semesterId, 10) : null;
    if (!semesterId) {
      const firstSemester = await db.semester.findOne();
      if (firstSemester) semesterId = firstSemester.id;
    }
    if (!semesterId) {
      return res.status(400).send({ message: "Semester not found." });
    }

    const created = await db.enrollment.create({
      studentId,
      sectionId,
      semesterId,
    });

    return res.status(201).send({
      id: created.id,
      enrollmentId: created.id,
      studentId: created.studentId,
      sectionId: created.sectionId,
      semesterId: created.semesterId,
      firstName: student.fName || "",
      lastName: student.lName || "",
      fName: student.fName || "",
      lName: student.lName || "",
      universityId: student.universityId || `U${student.id || ""}`,
      email: student.email || "",
    });
  } catch (err) {
    logger.error(`academic enrollSectionStudent failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to enroll student in section." });
  }
};

const exports = {
  getStudentCourses,
  enrollStudentCourse,
  updateEnrollment,
  getSections,
  getSectionStudents,
  enrollSectionStudent,
};

export default exports;
