import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const sectionInclude = [
  {
    model: db.course,
    as: "course",
    attributes: ["id", "name"],
  },
];

const findSection = (sectionId) =>
  db.section.findByPk(sectionId, { include: sectionInclude });

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

const parseSectionFields = ({
  sectionNumber,
  courseId,
  facultyId,
  daysOfWeek,
  startTime,
  endTime,
}) => {
  if (
    isBlank(sectionNumber) ||
    isBlank(courseId) ||
    isBlank(facultyId) ||
    isBlank(daysOfWeek) ||
    isBlank(startTime) ||
    isBlank(endTime)
  ) {
    return { error: { message: "Required" } };
  }

  const trimmedNumber = String(sectionNumber).trim();
  if (trimmedNumber.length > 10) {
    return {
      error: { message: "Section number must be 10 characters or fewer." },
    };
  }

  const trimmedDays = String(daysOfWeek).trim();
  if (trimmedDays.length > 10) {
    return {
      error: { message: "Section days of week must be 10 characters or fewer." },
    };
  }

  const trimmedStart = String(startTime).trim();
  const trimmedEnd = String(endTime).trim();
  if (!TIME_PATTERN.test(trimmedStart) || !TIME_PATTERN.test(trimmedEnd)) {
    return { error: { message: "Section time must be a valid date." } };
  }

  if (trimmedStart >= trimmedEnd) {
    return { error: { message: "Start time must be earlier than end time." } };
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
      sectionNumber: trimmedNumber,
      courseId: parsedCourseId,
      facultyId: parsedFacultyId,
      daysOfWeek: trimmedDays,
      startTime: trimmedStart,
      endTime: trimmedEnd,
    },
  };
};

exports.findAll = async (req, res) => {
  try {
    const sections = await db.section.findAll({
      include: sectionInclude,
      order: [
        [{ model: db.course, as: "course" }, "name", "ASC"],
        ["sectionNumber", "ASC"],
      ],
    });

    return res.send(sections);
  } catch (err) {
    logger.error(`section findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch sections." });
  }
};

exports.create = async (req, res) => {
  try {
    const fields = parseSectionFields(req.body);
    if (fields.error) {
      return res.status(400).send(fields.error);
    }

    const values = fields.values;

    const course = await db.course.findByPk(values.courseId);
    if (!course) {
      return res.status(400).send({ message: "Course not found." });
    }

    const faculty = await db.faculty.findByPk(values.facultyId);
    if (!faculty) {
      return res.status(400).send({ message: "Faculty not found." });
    }

    const existing = await db.section.findOne({
      where: {
        courseId: values.courseId,
        sectionNumber: values.sectionNumber,
      },
    });
    if (existing) {
      return res.status(400).send({
        message: "Section number is already taken in this course.",
      });
    }

    const created = await db.section.create(values);
    return res.status(201).send(await findSection(created.id));
  } catch (err) {
    logger.error(`section create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create section." });
  }
};

exports.update = async (req, res) => {
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

    const fields = parseSectionFields(req.body);
    if (fields.error) {
      return res.status(400).send(fields.error);
    }

    const values = fields.values;

    const course = await db.course.findByPk(values.courseId);
    if (!course) {
      return res.status(400).send({ message: "Course not found." });
    }

    const faculty = await db.faculty.findByPk(values.facultyId);
    if (!faculty) {
      return res.status(400).send({ message: "Faculty not found." });
    }

    const duplicate = await db.section.findOne({
      where: {
        courseId: values.courseId,
        sectionNumber: values.sectionNumber,
      },
    });
    if (duplicate && duplicate.id !== sectionId) {
      return res.status(400).send({
        message: "Section number is already taken in this course.",
      });
    }

    await db.section.update(values, { where: { id: sectionId } });
    return res.status(200).send(await findSection(sectionId));
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

export default exports;