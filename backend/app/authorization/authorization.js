import { Op } from "sequelize";
import db from "../models/index.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  const session = await db.session.findOne({
    where: {
      token,
      expirationDate: { [Op.gte]: new Date() },
    },
    include: [{ model: db.user, as: "user" }],
  });

  if (!session || !session.user) {
    return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
  }

  req.user = {
    id: session.user.id,
    role: session.user.role,
  };

  next();
};
export const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  const session = await db.session.findOne({
    where: {
      token,
      expirationDate: { [Op.gte]: new Date() },
    },
    include: [{ model: db.user, as: "user" }],
  });

  if (!session || !session.user) {
    return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
  }

  req.user = {
    id: session.user.id,
    role: session.user.role,
  };

  if (session.user.role !== "admin") {
    return res.status(403).send({ message: "Admin role required." });
  }

  next();
};
