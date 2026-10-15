import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const ownEnrollmentsMessage = "You can only access your own enrollments.";

const roleOf = (user) => user?.role?.toLowerCase?.().trim?.() ?? "";

const parseId = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const loadStudent = async (studentId) => {
  const user = await db.user.findByPk(studentId);
  if (!user || roleOf(user) !== "student") {
    return null;
  }
  return user;
};

const authorizeStudentPath = async (req, res) => {
  const studentId = parseId(req.params.studentId);
  if (studentId === null) {
    res.status(404).send({ message: "Student not found." });
    return null;
  }

  const student = await loadStudent(studentId);
  if (!student) {
    res.status(404).send({ message: "Student not found." });
    return null;
  }

  const role = roleOf(req.user);
  if (role === "faculty" || (role === "student" && req.user.id === studentId)) {
    return studentId;
  }

  res.status(403).send({ message: ownEnrollmentsMessage });
  return null;
};

const readEnrollmentBody = async (body, studentId, currentEnrollmentId = null) => {
  const sectionId = parseId(body?.sectionId);
  if (sectionId === null || !(await db.section.findByPk(sectionId))) {
    return { error: { status: 400, message: "Section not found." } };
  }

  const semesterId = parseId(body?.semesterId);
  if (semesterId === null || !(await db.semester.findByPk(semesterId))) {
    return { error: { status: 400, message: "Semester not found." } };
  }

  const where = { studentId, sectionId };
  if (currentEnrollmentId !== null) {
    where.id = { [Op.ne]: currentEnrollmentId };
  }

  const duplicate = await db.enrollment.findOne({ where });
  if (duplicate) {
    return { error: { status: 400, message: "Enrollment already exists." } };
  }

  return { values: { sectionId, semesterId, studentId } };
};

const listOrder = [
  ["sectionId", "ASC"],
  ["id", "ASC"],
];

exports.findAll = async (req, res) => {
  try {
    const enrollments = await db.enrollment.findAll({ order: listOrder });
    return res.send(enrollments);
  } catch (err) {
    logger.error(`enrollment findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch enrollments." });
  }
};

exports.findForStudent = async (req, res) => {
  try {
    const studentId = await authorizeStudentPath(req, res);
    if (studentId === null) {
      return;
    }

    const enrollments = await db.enrollment.findAll({
      where: { studentId },
      order: listOrder,
    });
    return res.send(enrollments);
  } catch (err) {
    logger.error(`enrollment findForStudent failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch enrollments." });
  }
};

exports.create = async (req, res) => {
  try {
    const studentId = await authorizeStudentPath(req, res);
    if (studentId === null) {
      return;
    }

    const result = await readEnrollmentBody(req.body, studentId);
    if (result.error) {
      return res.status(result.error.status).send({ message: result.error.message });
    }

    const created = await db.enrollment.create(result.values);
    return res.status(201).send(created);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).send({ message: "Enrollment already exists." });
    }
    logger.error(`enrollment create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create enrollment." });
  }
};

exports.update = async (req, res) => {
  try {
    const studentId = await authorizeStudentPath(req, res);
    if (studentId === null) {
      return;
    }

    const enrollmentId = parseId(req.params.enrollmentId);
    if (enrollmentId === null) {
      return res.status(404).send({
        message: `Enrollment with id=${req.params.enrollmentId} not found.`,
      });
    }

    const existing = await db.enrollment.findOne({
      where: { id: enrollmentId, studentId },
    });
    if (!existing) {
      return res.status(404).send({
        message: `Enrollment with id=${enrollmentId} not found.`,
      });
    }

    const result = await readEnrollmentBody(req.body, studentId, enrollmentId);
    if (result.error) {
      return res.status(result.error.status).send({ message: result.error.message });
    }

    await existing.update({
      sectionId: result.values.sectionId,
      semesterId: result.values.semesterId,
    });

    return res.status(200).send(existing);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).send({ message: "Enrollment already exists." });
    }
    logger.error(`enrollment update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update enrollment." });
  }
};

exports.remove = async (req, res) => {
  try {
    const studentId = await authorizeStudentPath(req, res);
    if (studentId === null) {
      return;
    }

    const enrollmentId = parseId(req.params.enrollmentId);
    if (enrollmentId === null) {
      return res.status(404).send({
        message: `Enrollment with id=${req.params.enrollmentId} not found.`,
      });
    }

    const existing = await db.enrollment.findOne({
      where: { id: enrollmentId, studentId },
    });
    if (!existing) {
      return res.status(404).send({
        message: `Enrollment with id=${enrollmentId} not found.`,
      });
    }

    await existing.destroy();
    return res.status(200).send({ message: "Enrollment deleted." });
  } catch (err) {
    logger.error(`enrollment delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete enrollment." });
  }
};

export default exports;