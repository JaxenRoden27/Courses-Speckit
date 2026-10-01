import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const sectionInclude = [
  {
    model: db.semester,
    as: "semester",
    attributes: ["id", "name"],
  },
  {
    model: db.course,
    as: "course",
    attributes: ["id", "name"],
  },
  {
    model: db.faculty,
    as: "faculty",
    attributes: ["id", "firstName", "lastName"],
  },
];

const findSection = (sectionId) =>
  db.section.findByPk(sectionId, {
    include: sectionInclude,
  });

exports.findAll = async (req, res) => {
  try {
    const query = {
      include: teamInclude,
      order: [
        [{ model: db.semester, as: "semester" }, "name", "ASC"],
        [{ model: db.course, as: "course" }, "name", "ASC"],
        [{ model: db.faculty, as: "faculty" }, "firstName", "lastName", "ASC"],
        ["name", "ASC"],
      ],
    };

    if (req.user.role === "faculty") {
      query.where = { facultyId: req.user.id };
    }

    const sections = await db.section.findAll(query);

    return res.send(sections);
  } catch (err) {
    logger.error(`section findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch sections." });
  }
};

const parseSectionFields = ({ sectionNumber, semesterId, courseId, facultyId, daysOfWeek, startTime, endTime }) => {
  if (
    !sectionNumber?.trim() ||
    semesterId === undefined ||
    semesterId === null ||
    semesterId === "" ||
    !courseId?.toString().trim() ||
    !facultyId?.toString().trim() ||
    !daysOfWeek?.toString().trim() ||
    !startTime?.toString().trim() ||
    !endTime?.toString().trim()
  ) {
    return { error: { message: "Required" } };
  }

  if (sectionNumber.trim().length > 2) {
    return { error: { message: "Section number must be 2 characters or fewer." } };
  }

  const parsedSemesterId = parseInt(semesterId, 10);
  if (Number.isNaN(parsedSemesterId)) {
    return { error: { message: "Semester not found." } };
  }

  const parsedCourseId = parseInt(courseId, 10);
  if (Number.isNaN(parsedCourseId)) {
    return { error: { message: "Course not found." } };
  }

  const parsedFacultyId = parseInt(facultyId, 10);
  if (Number.isNaN(parsedFacultyId)) {
    return { error: { message: "Faculty not found." } };
  }

  return {
    values: {
      sectionNumber: sectionNumber.trim(),
      semesterId: parsedSemesterId,
      courseId: parsedCourseId,
      facultyId: parsedFacultyId,
      daysOfWeek: daysOfWeek.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
    },
  };
};

exports.create = async (req, res) => {
  try {
    const fields = parseSectionFields(req.body);
    if (fields.error) {
      return res.status(400).send(fields.error);
    }

    const { sectionNumber, semesterId, courseId, facultyId, daysOfWeek, startTime, endTime } = fields.values;

    const semester = await db.semester.findByPk(semesterId);
    if (!semester) {
      return res.status(400).send({ message: "Semester not found." });
    }

    const course = await db.course.findByPk(courseId);
    if (!course) {
      return res.status(400).send({ message: "Course not found." });
    }

    const faculty = await db.faculty.findByPk(facultyId);
    if (!faculty) {
      return res.status(400).send({ message: "Faculty not found." });
    }

    const existing = await db.section.findOne({
      where: { courseId, sectionNumber },
    });
    if (existing) {
      return res.status(400).send({
        message: "Section number is already taken in this course.",
      });
    }

    const created = await db.section.create({
      sectionNumber,
      semesterId,
      courseId,
      facultyId,
      daysOfWeek,
      startTime,
      endTime,
    });

    return res.status(201).send(await findSection(created.id));
  } catch (err) {
    logger.error(`section create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create section." });
  }
};

exports.update = async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId ?? req.body.sectionId, 10);

    if (Number.isNaN(sectionId)) {
      return res.status(400).send({ message: "Invalid section id." });
    }

    const existing = await db.section.findByPk(sectionId);
    if (!existing) {
      return res.status(404).send({
        message: `Section with id=${sectionId} not found.`,
      });
    }

    const fields = parseSectionFields(req.body);
    if (fields.error) {
      return res.status(400).send(fields.error);
    }

    const { sectionNumber, semesterId, courseId, facultyId, daysOfWeek, startTime, endTime } = fields.values;

    const semester = await db.semester.findByPk(semesterId);
    if (!semester) {
      return res.status(400).send({ message: "Semester not found." });
    }

    const course = await db.course.findByPk(courseId);
    if (!course) {
      return res.status(400).send({ message: "Course not found." });
    }

    const faculty = await db.faculty.findByPk(facultyId);
    if (!faculty) {
      return res.status(400).send({ message: "Faculty not found." });
    }

    const duplicate = await db.section.findOne({
      where: { courseId, sectionNumber },
    });
    if (duplicate && duplicate.id !== sectionId) {
      return res.status(400).send({
        message: "Section number is already taken in this course.",
      });
    }

    await db.section.update(
      {
        sectionNumber,
        semesterId,
        courseId,
        facultyId,
        daysOfWeek,
        startTime,
        endTime,
      },
      { where: { id: sectionId } }
    );

    return res.status(200).send({ message: "section updated successfully." });
  } catch (err) {
    logger.error(`section update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update section." });
  }
};

exports.remove = async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId, 10);
    if (Number.isNaN(sectionId)) {
      return res.status(400).send({ message: "Invalid section id." });
    }

    const existing = await db.section.findByPk(sectionId);
    if (!existing) {
      return res.status(404).send({
        message: `Section with id=${sectionId} not found.`,
      });
    }

    await db.section.destroy({ where: { id: sectionId } });

    return res.status(200).send({ message: "section deleted successfully." });
  } catch (err) {
    logger.error(`section delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete section." });
  }
};

exports.findPlayers = async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId, 10);
    if (Number.isNaN(sectionId)) {
      return res.status(400).send({ message: "Invalid section id." });
    }

    const section = await db.section.findByPk(sectionId);
    if (!team) {
      return res.status(404).send({
        message: `Section with id=${sectionId} not found.`,
      });
    }

    return res.send(section);
  } catch (err) {
    logger.error(`section findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch sections." });
  }
};

const canManageSection = async (user, section) => {
  if (user.role === "admin") {
    return true;
  }

  if (user.role !== "faculty") {
    return false;
  }

  const person = await db.person.findOne({ where: { userId: user.id } });
  return Boolean(person && section.facultyId === person.id);
};

exports.createPlayer = async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId, 10);
    const { personId, position, number } = req.body;

    if (Number.isNaN(sectionId)) {
      return res.status(400).send({ message: "Invalid section id." });
    }

    const section = await db.section.findByPk(sectionId);
    if (!team) {
      return res.status(404).send({
        message: `Section with id=${sectionId} not found.`,
      });
    }

    if (!(await canManageSection(req.user, section))) {
      return res.status(403).send({ message: "Admin role required." });
    }

    if (
      personId === undefined ||
      personId === null ||
      personId === "" ||
      !daysOfWeek?.toString().trim() ||
      !startTime?.toString().trim() ||
      !endTime?.toString().trim()
    ) {
      return res.status(400).send({ message: "Required" });
    }

    if (daysOfWeek.trim().length > 10) {
      return res.status(400).send({
        message: "Days of week must be 10 characters or fewer.",
      });
    }

    const parsedStartTime = time(startTime, 10);
    if (Number.isNaN(parsedStartTime)) {
      return res.status(400).send({ message: "Start time must be a valid time." });
    }

    const existingSection = await db.section.findOne({
      where: { courseId, sectionNumber },
    });
    if (existingSection) {
      return res.status(400).send({
        message: "Section number is already taken in this course.",
      });
    }

    const existingNumber = await db.player.findOne({
      where: { sectionId, number: parsedNumber },
    });
    if (existingSection) {
      return res.status(400).send({
        message: "Section number is already taken in this course.",
      });
    }
    return res.status(201).send(section);
  } catch (err) {
    logger.error(`section create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create section." });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId, 10);
    const { sectionNumber, semesterId, courseId, facultyId, daysOfWeek, startTime, endTime } = req.body;

    if (Number.isNaN(sectionId)) {
      return res.status(400).send({ message: "Invalid section id." });
    }

    const existing = await db.section.findOne({
      where: { id: sectionId, sectionNumber },
    });
    if (!existing) {
      return res.status(404).send({
        message: `Section with id=${sectionId} not found.`,
      });
    }

    const section = await db.section.findByPk(sectionId);
    if (!(await canManageSection(req.user, section))) {
      return res.status(403).send({ message: "Admin role required." });
    }

    if (
      sectionNumber === undefined ||
      sectionNumber === null ||
      sectionNumber === "" ||
      semesterId === undefined ||
      semesterId === null ||
      semesterId === "" ||
      courseId === undefined ||
      courseId === null ||
      courseId === "" ||
      facultyId === undefined ||
      facultyId === null ||
      facultyId === "" ||
      daysOfWeek === undefined ||
      daysOfWeek === null ||
      daysOfWeek === "" ||
      startTime === undefined ||
      startTime === null ||
      startTime === "" ||
      endTime === undefined ||
      endTime === null ||
      endTime === ""
    ) {
      return res.status(400).send({ message: "Required" });
    }

    if (sectionNumber.trim().length > 2) {
      return res.status(400).send({
        message: "Section number must be 2 characters or fewer.",
      });
    }

    const parsedSemesterId = parseInt(semesterId, 10);
    if (Number.isNaN(parsedSemesterId)) {
      return res.status(400).send({ message: "Semester not found." });
    }

    const parsedCourseId = parseInt(courseId, 10);
    if (Number.isNaN(parsedCourseId)) {
      return res.status(400).send({ message: "Course not found." });
    }

    const existingSection = await db.section.findOne({
      where: { courseId, sectionNumber },
    });
    if (existingSection && existingSection.id !== sectionId) {
      return res.status(400).send({
        message: "Section number is already taken in this course.",
      });
    }

    const existingStartTime = await db.section.findOne({
      where: { teamId, number: parsedNumber },
    });
    if (existingNumber && existingNumber.id !== playerId) {
      return res.status(400).send({
        message: "Player number is already taken on this team.",
      });
    }

    await db.section.update(
      {
        sectionNumber,
        semesterId,
        courseId,
        facultyId,
        daysOfWeek,
        startTime,
        endTime,
      },
      { where: { id: sectionId } }
    );

    return res.status(200).send({ message: "section updated successfully." });
  } catch (err) {
    logger.error(`section update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update section." });
  }
};

exports.removeSection = async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId, 10);
    if (Number.isNaN(sectionId)) {
      return res.status(400).send({ message: "Invalid section id." });
    }

    const section = await db.section.findByPk(sectionId);
    if (!section) {
      return res.status(404).send({
        message: `Section with id=${sectionId} not found.`,
      });
    }

    if (!(await canManageSection(req.user, section))) {
      return res.status(403).send({ message: "Admin role required." });
    }

    const deleted = await db.section.destroy({
      where: { id: sectionId },
    });
    if (!deleted) {
      return res.status(404).send({
        message: `Section with id=${sectionId} not found.`,
      });
    }

    return res.status(200).send({ message: "section deleted successfully." });
  } catch (err) {
    logger.error(`section delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete section." });
  }
};

export default exports;