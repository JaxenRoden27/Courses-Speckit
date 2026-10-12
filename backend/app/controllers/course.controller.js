import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const presentCourse = (row) => row.toJSON();

const readCourse = (body) => {
  const courseName = typeof body?.courseName === "string" ? body.courseName.trim() : "";
  const term = typeof body?.term === "string" ? body.term.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const sections = typeof body?.sections === "array" ? body.sections : [];
  if (!courseName || !term || !description || !Array.isArray(sections)) {
    return null;
  }

  return { courseName, term, description, sections };
};

exports.findAll = async (req, res) => {
  try {
    const courses = await db.course.findAll({
      order: [
        ["courseName", "ASC"],
        ["id", "ASC"],
      ],
    });

    return res.send(courses.map(presentCourse));
  } catch (err) {
    logger.error(`course findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch courses." });
  }
};

exports.create = async (req, res) => {
  try {
    const input = readCourse(req.body);
    if (!input) {
      return res.status(400).send({ message: "Course, term, and description are required." });
    }

    const existing = await db.course.findOne({
      where: { courseName: input.courseName },
    });
    if (existing) {
      return res.status(400).send({ message: "Course name already exists." });
    }

    const created = await db.course.create(input);
    return res.status(201).send(presentCourse(created));
  } catch (err) {
    logger.error(`course create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create course." });
  }
};

exports.update = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).send({ message: "Invalid courseId." });
    }

    const input = readCourse(req.body);
    if (!input) {
      return res.status(400).send({ message: "Course, term, and description are required." });
    }

    if (input.sections.length > 0) {
      return res.status(400).send({ message: "Sections are not allowed to be updated." });
    }

    const course = await db.course.findByPk(courseId);
    if (!course) {
      return res.status(404).send({ message: "Course not found." });
    }

    const existing = await db.course.findOne({
      where: {
        courseName: input.courseName,
        id: { [Op.ne]: courseId },
      },
    });
    if (existing) {
      return res.status(400).send({ message: "Course already exists." });
    }

    await course.update({
      courseName: input.courseName,
      term: input.term,
      description: input.description || "",
    });
    return res.status(200).send(presentCourse(course));
  } catch (err) {
    logger.error(`Course update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update course." });
  }
};

exports.remove = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).send({ message: "Invalid courseId." });
    }

    if (input.sections.length > 0) {
      return res.status(400).send({ message: "Sections are not allowed to be deleted." });
    }

    const existing = await db.course.findByPk(courseId);
    if (!existing) {
      return res.status(404).send({ message: "Course not found." });
    }

    await existing.update({
      sections: [],
    });
    return res.status(200).send(presentCourse(existing));
  } catch (err) {
    logger.error(`Course delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete course." });
  }
};
