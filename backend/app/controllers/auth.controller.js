import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const SALT_ROUNDS = 10;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const buildAuthResponse = (user, token) => ({
  userId: user.id,
  universityId: user.universityId,
  email: user.email,
  fName: user.fName,
  lName: user.lName,
  role: user.role,
  token,
});

const createOrReuseSession = async (user) => {
  const existingSession = await db.session.findOne({
    where: {
      userId: user.id,
      email: user.email,
      expirationDate: { [Op.gte]: new Date() },
      token: { [Op.ne]: "" },
    },
  });

  if (existingSession) {
    return existingSession.token;
  }

  const expirationDate = new Date(Date.now() + SESSION_TTL_MS);
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    authConfig.secret,
    { expiresIn: 86400 }
  );

  await db.session.create({
    token,
    email: user.email,
    expirationDate,
    userId: user.id,
  });

  return token;
};

const exports = {};

exports.register = async (req, res) => {
  try {
    const { fName, lName, email, universityId, password } = req.body;

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
    if (!password) {
      return res.status(400).send({ message: "Password is required." });
    }
    if (password.length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters." });
    }

      const normalizedUniversityId = universityId.trim().toLowerCase();

    const existingUniversityId = await db.user.findOne({
      where: { universityId: normalizedUniversityId },
    });
    if (existingUniversityId) {
      return res.status(400).send({ message: "University ID is already taken." });
    }

    const existingEmail = await db.user.findOne({
      where: { email: email.trim() },
    });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await db.user.create({
      fName: fName.trim(),
      lName: lName.trim(),
      email: email.trim(),
      universityId: normalizedUniversityId,
      password: hashedPassword,
    });

    const normalizedEmail = email.trim().toLowerCase();
    const matchingPeople = (await db.person.findAll()).filter((person) =>
      person.email.trim().toLowerCase() === normalizedEmail
    );
    if (matchingPeople.length === 1 && matchingPeople[0].userId == null) {
      await matchingPeople[0].update({ userId: user.id });
    }

    const token = await createOrReuseSession(user);

    return res.status(201).send(buildAuthResponse(user, token));
  } catch (err) {
    logger.error(`Registration failed: ${err.message}`);
    return res.status(500).send({ message: "Registration failed." });
  }
};

exports.login = async (req, res) => {
  try {
    const { universityId, password } = req.body;

    if (!universityId?.trim()) {
      return res.status(400).send({ message: "University ID is required." });
    }
    if (!password) {
      return res.status(400).send({ message: "Password is required." });
    }

    const normalizedUniversityId = universityId.trim().toLowerCase();
    const user = await db.user.unscoped().findOne({
      where: { universityId: normalizedUniversityId },
    });

    if (!user) {
      return res.status(401).send({ message: "Invalid university ID or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send({ message: "Invalid university ID or password." });
    }

    const token = await createOrReuseSession(user);

    return res.status(200).send(buildAuthResponse(user, token));
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    return res.status(500).send({ message: "Login failed." });
  }
};

exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (token) {
      await db.session.update({ token: "" }, { where: { token } });
    }

    return res.status(200).send({ message: "Signed out successfully." });
  } catch (err) {
    logger.error(`Logout failed: ${err.message}`);
    return res.status(500).send({ message: "Logout failed." });
  }
};

export default exports;
