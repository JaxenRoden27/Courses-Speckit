import { Op } from "sequelize";
import db from "../models/index.js";

const loadSessionUser = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).send({ message: "Unauthorized! No token provided." });
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).send({ message: "Unauthorized! No token provided." });
    return null;
  }

  const session = await db.session.findOne({
    where: {
      token,
      expirationDate: { [Op.gte]: new Date() },
    },
    include: [{ model: db.user, as: "user" }],
  });

  if (!session || !session.user) {
    res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
    return null;
  }

  return session.user;
};

const attachUser = (req, user) => {
  req.user = {
    id: user.id,
    role: user.role,
    universityId: user.universityId,
  };
};

export const authenticate = async (req, res, next) => {
  const user = await loadSessionUser(req, res);
  if (!user) {
    return;
  }

  attachUser(req, user);
  next();
};

export const authenticateStudent = async (req, res, next) => {
  const user = await loadSessionUser(req, res);
  if (!user) {
    return;
  }

  attachUser(req, user);

  if (user.role.toLowerCase().trim() !== "student") {
    return res.status(403).send({ message: "Student role required." });
  }

  next();
};

export const authenticateFaculty = async (req, res, next) => {
  const user = await loadSessionUser(req, res);
  if (!user) {
    return;
  }

  attachUser(req, user);

  if (user.role.toLowerCase().trim() !== "faculty") {
    return res.status(403).send({ message: "Faculty role required." });
  }

  next();
};
