import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";

const SALT_ROUNDS = 10;

const exports = {};

exports.findAll = async (req, res) => {
  try {
    const users = await db.user.findAll({
      attributes: ["id", "universityId", "fName", "lName"],
      order: [["universityId", "ASC"]],
    });

    return res.send(users);
  } catch (err) {
    logger.error(`User findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch users." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const user = await db.user.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    return res.send(user);
  } catch (err) {
    logger.error(`User findOne failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch user profile." });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const user = await db.user.unscoped().findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    const { fName, lName, email, universityId, password, role } = req.body;

    if (!fName?.trim()) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (!lName?.trim()) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (!email?.trim()) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (!universityId?.trim()) {
      return res.status(400).send({ message: "University ID is required." });
    }

    const normalizedUniversityId = universityId.trim().toLowerCase();
    const trimmedEmail = email.trim();

    const existingUniversityId = await db.user.findOne({
      where: {
        universityId: normalizedUniversityId,
        id: { [Op.ne]: user.id },
      },
    });
    if (existingUniversityId) {
      return res.status(400).send({ message: "University ID is already taken." });
    }

    const existingEmail = await db.user.findOne({
      where: {
        email: trimmedEmail,
        id: { [Op.ne]: user.id },
      },
    });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    if (password !== undefined && password !== null && password !== "") {
      if (password.length < 8) {
        return res.status(400).send({ message: "Password must be at least 8 characters." });
      }

      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    user.fName = fName.trim();
    user.lName = lName.trim();
    user.email = trimmedEmail;
    user.universityId = normalizedUniversityId;
    if (role !== undefined && role !== null && String(role).trim()) {
      user.role = String(role).trim();
    }

    await user.save();

    const updatedUser = await db.user.findByPk(userId);
    return res.send(updatedUser);
  } catch (err) {
    logger.error(`User update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update user profile." });
  }
};

export default exports;
