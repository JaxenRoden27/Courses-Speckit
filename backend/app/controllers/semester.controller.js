import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const TERMS = ["Fall", "Winter", "Spring", "Summer"];
const MONDAY = 1;
const THURSDAY = 4;
const FRIDAY = 5;

const studentInclude = {
  model: db.user,
  as: "user",
  attributes: ["id", "fName", "lName", "universityId"],
};

const toISODate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const nthWeekday = (year, monthIndex, weekday, n) => {
  const firstDow = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const day = 1 + ((weekday - firstDow + 7) % 7) + (n - 1) * 7;
  return new Date(Date.UTC(year, monthIndex, day));
};

const lastWeekday = (year, monthIndex, weekday) => {
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const day = last.getUTCDate() - ((last.getUTCDay() - weekday + 7) % 7);
  return new Date(Date.UTC(year, monthIndex, day));
};

const weekdayOfWeek = (year, monthIndex, weekNumber, weekday) => {
  const firstDow = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const week1Monday = 1 - ((firstDow + 6) % 7);
  const offsetFromMonday = (weekday + 6) % 7;
  const day = week1Monday + (weekNumber - 1) * 7 + offsetFromMonday;
  return new Date(Date.UTC(year, monthIndex, day));
};

const semesterDates = (term, year) => {
  const ranges = {
    Fall: [lastWeekday(year, 7, THURSDAY), nthWeekday(year, 11, FRIDAY, 3)],
    Spring: [weekdayOfWeek(year, 0, 2, MONDAY), nthWeekday(year, 4, THURSDAY, 1)],
    Summer: [weekdayOfWeek(year, 4, 3, MONDAY), weekdayOfWeek(year, 7, 2, THURSDAY)],
    Winter: [nthWeekday(year, 11, MONDAY, 4), nthWeekday(year + 1, 0, THURSDAY, 1)],
  };
  const range = ranges[term];
  if (!range) {
    return null;
  }
  const [start, end] = range;
  return { startDate: toISODate(start), endDate: toISODate(end) };
};

const readTermYear = (body) => {
  const term = typeof body?.term === "string" ? body.term.trim() : "";
  const year = Number(body?.year);
  if (!TERMS.includes(term) || !Number.isInteger(year) || year < 1000 || year > 9999) {
    return null;
  }
  return { term, year, name: `${term} ${year}`, dates: semesterDates(term, year) };
};

const presentSemester = (row) => {
  const data = row.toJSON();
  return {
    ...data,
    name: data.semester,
  };
};

const findSemester = (semesterId) =>
  db.semester.findByPk(semesterId, { include: studentInclude });

const isStudent = (req) => req.user?.role?.toLowerCase?.().trim() === "student";

exports.findAll = async (req, res) => {
  try {
    const where = isStudent(req) ? { userId: req.user.id } : {};
    const semesters = await db.semester.findAll({
      where,
      include: studentInclude,
      order: [
        ["startDate", "ASC"],
        ["id", "ASC"],
      ],
    });

    return res.send(semesters.map(presentSemester));
  } catch (err) {
    logger.error(`semester findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch semesters." });
  }
};

exports.create = async (req, res) => {
  try {
    if (!isStudent(req)) {
      return res.status(403).send({
        message: "Only the owning student can change this semester.",
      });
    }

    const input = readTermYear(req.body);
    if (!input) {
      return res.status(400).send({ message: "Term and year are required." });
    }

    const userId = req.user.id;
    const existing = await db.semester.findOne({
      where: { userId, semester: input.name },
    });
    if (existing) {
      return res.status(400).send({ message: "Semester already exists." });
    }

    const created = await db.semester.create({
      semester: input.name,
      startDate: input.dates.startDate,
      endDate: input.dates.endDate,
      userId,
    });

    return res.status(201).send(presentSemester(await findSemester(created.id)));
  } catch (err) {
    logger.error(`semester create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create semester." });
  }
};

exports.update = async (req, res) => {
  try {
    if (!isStudent(req)) {
      return res.status(403).send({
        message: "Only the owning student can change this semester.",
      });
    }

    const semesterId = parseInt(req.params.semesterId, 10);
    if (Number.isNaN(semesterId)) {
      return res.status(400).send({ message: "Invalid semesterId." });
    }

    const input = readTermYear(req.body);
    if (!input) {
      return res.status(400).send({ message: "Term and year are required." });
    }

    const semester = await db.semester.findOne({
      where: { id: semesterId, userId: req.user.id },
    });
    if (!semester) {
      return res.status(404).send({ message: "Semester not found." });
    }

    const existing = await db.semester.findOne({
      where: {
        userId: req.user.id,
        semester: input.name,
        id: { [Op.ne]: semesterId },
      },
    });
    if (existing) {
      return res.status(400).send({ message: "Semester already exists." });
    }

    await semester.update({
      semester: input.name,
      startDate: input.dates.startDate,
      endDate: input.dates.endDate,
    });

    return res.status(200).send(presentSemester(await findSemester(semesterId)));
  } catch (err) {
    logger.error(`Semester update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update semester." });
  }
};

exports.remove = async (req, res) => {
  try {
    if (!isStudent(req)) {
      return res.status(403).send({
        message: "Only the owning student can change this semester.",
      });
    }

    const semesterId = parseInt(req.params.semesterId, 10);
    if (Number.isNaN(semesterId)) {
      return res.status(400).send({ message: "Invalid semesterId." });
    }

    const existing = await db.semester.findOne({
      where: { id: semesterId, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).send({ message: "Semester not found." });
    }

    await existing.destroy();

    return res.status(200).send({ message: "Semester deleted." });
  } catch (err) {
    logger.error(`semester delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete semester." });
  }
};

export default exports;
