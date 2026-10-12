import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const presentCourse = (row) => row.toJSON();

const trimString = (value) => (typeof value === "string" ? value.trim() : "");

const notFoundMessage = (courseId) => `Cannot find Course with id=${courseId}.`;

const readCourse = (body) => {
  const courseNumber = trimString(body?.courseNumber);
  const courseName = trimString(body?.courseName);
  const courseDescription = trimString(body?.courseDescription);
  const courseTerm = trimString(body?.courseTerm);

  if (!courseNumber) {
    return { error: "Course Number cannot be empty for course!" };
  }
  if (courseNumber.length > 15) {
    return { error: "Course number must be at most 15 characters." };
  }
  if (!courseName) {
    return { error: "Course Name cannot be empty for course!" };
  }
  if (!courseTerm) {
    return { error: "Course Term cannot be empty for course!" };
  }

  return {
    value: {
      courseNumber,
      courseName,
      courseDescription,
      courseTerm,
    },
  };
};

const parseCourseId = (value) => {
  const courseId = parseInt(value, 10);
  return Number.isNaN(courseId) ? null : courseId;
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

exports.findOne = async (req, res) => {
  try {
    const courseId = parseCourseId(req.params.courseId);
    if (courseId == null) {
      return res.status(400).send({ message: "Invalid courseId." });
    }

    const courses = await db.course.findAll({
      where: { id: courseId },
    });

    return res.send(courses.map(presentCourse));
  } catch (err) {
    logger.error(`course findOne failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch course." });
  }
};

exports.create = async (req, res) => {
  try {
    const input = readCourse(req.body);
    if (input.error) {
      return res.status(400).send({ message: input.error });
    }

    const existing = await db.course.findOne({
      where: { courseNumber: input.value.courseNumber },
    });
    if (existing) {
      return res.status(400).send({ message: "Course number already exists." });
    }

    const created = await db.course.create(input.value);
    return res.status(201).send(presentCourse(created));
  } catch (err) {
    logger.error(`course create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create course." });
  }
};

exports.update = async (req, res) => {
  try {
    const courseId = parseCourseId(req.params.courseId);
    if (courseId == null) {
      return res.status(400).send({ message: "Invalid courseId." });
    }

    const input = readCourse(req.body);
    if (input.error) {
      return res.status(400).send({ message: input.error });
    }

    const course = await db.course.findByPk(courseId);
    if (!course) {
      return res.status(404).send({ message: notFoundMessage(courseId) });
    }

    const existing = await db.course.findOne({
      where: {
        courseNumber: input.value.courseNumber,
        id: { [Op.ne]: courseId },
      },
    });
    if (existing) {
      return res.status(400).send({ message: "Course number already exists." });
    }

    await course.update(input.value);
    return res.status(200).send({ message: "Course was updated successfully." });
  } catch (err) {
    logger.error(`Course update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update course." });
  }
};

exports.remove = async (req, res) => {
  try {
    const courseId = parseCourseId(req.params.courseId);
    if (courseId == null) {
      return res.status(400).send({ message: "Invalid courseId." });
    }

    const existing = await db.course.findByPk(courseId);
    if (!existing) {
      return res.status(404).send({ message: notFoundMessage(courseId) });
    }

    await existing.destroy();
    return res.status(200).send({ message: "Course was deleted successfully!" });
  } catch (err) {
    logger.error(`Course delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete course." });
  }
};

export default exports;
