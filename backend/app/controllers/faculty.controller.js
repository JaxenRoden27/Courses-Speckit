import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const normalizeUserId = (userId) => {
  if (userId === undefined || userId === null || userId === "") {
    return null;
  }

  const parsed = parseInt(userId, 10);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const presentFaculty = (row) => {
    const data = row.toJSON();
    return {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      dept: data.dept,
      userId: data.userId ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  };

const validateFacultyFields = ({ firstName, lastName, dept }) => {
  if (!firstName?.trim() || !lastName?.trim() || !dept?.trim()) {
    return { message: "Required" };
  }

  if (firstName.trim().length > 50) {
    return { message: "First name must be 50 characters or fewer." };
  }

  if (lastName.trim().length > 50) {
    return { message: "Last name must be 50 characters or fewer." };
  }

  if (dept.trim().length > 50) {
    return { message: "Department must be 50 characters or fewer." };
  }

  return null;
};

const resolveUserLink = async (userId, facultyId) => {
  const normalized = normalizeUserId(userId);
  if (Number.isNaN(normalized)) {
    return { error: { message: "User not found." } };
  }

  if (normalized === null) {
    return { userId: null };
  }

  const user = await db.user.findByPk(normalized);
  if (!user) {
    return { error: { message: "User not found." } };
  }

  if (user.role.toLowerCase().trim() !== "faculty") {
    return { error: { message: "User must have role faculty." } };
  }

  const linked = await db.faculty.findOne({ where: { userId: normalized } });
  if (linked && linked.id !== facultyId) {
    return { error: { message: "User is already linked to a faculty member." } };
  }

  return { userId: normalized };
};

exports.findAll = async (req, res) => {
    try {
      const faculty = await db.faculty.findAll({
        order: [
          ["lastName", "ASC"],
          ["firstName", "ASC"],
        ],
      });
  
      return res.send(faculty.map(presentFaculty));
    } catch (err) {
      logger.error(`faculty findAll failed: ${err.message}`);
      return res.status(500).send({ message: "Failed to fetch faculty." });
    }
  };
  
  exports.create = async (req, res) => {
    try {
      const { firstName, lastName, dept, userId } = req.body;
      const fieldError = validateFacultyFields({ firstName, lastName, dept });
      if (fieldError) {
        return res.status(400).send(fieldError);
      }
  
      const link = await resolveUserLink(userId, null);
      if (link.error) {
        return res.status(400).send(link.error);
      }
  
      const created = await db.faculty.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dept: dept.trim(),
        userId: link.userId,
      });

      return res.status(201).send(presentFaculty(created));
    } catch (err) {
      logger.error(`faculty create failed: ${err.message}`);
      return res.status(500).send({ message: "Failed to create faculty." });
    }
  };
  
  exports.update = async (req, res) => {
    try {
      const facultyId = parseInt(req.params.facultyId, 10);
      const { firstName, lastName, dept, userId } = req.body;
  
      if (Number.isNaN(facultyId)) {
        return res.status(400).send({ message: "Invalid faculty id." });
      }
  
      const existing = await db.faculty.findByPk(facultyId);
      if (!existing) {
        return res.status(404).send({
          message: `Faculty with id=${facultyId} not found.`,
        });
      }

      const fieldError = validateFacultyFields({ firstName, lastName, dept });
      if (fieldError) {
        return res.status(400).send(fieldError);
      }
  
      const link = await resolveUserLink(userId, facultyId);
      if (link.error) {
        return res.status(400).send(link.error);
      }

      await existing.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dept: dept.trim(),
        userId: link.userId,
      });
  
      return res.status(200).send(presentFaculty(existing));
    } catch (err) {
      logger.error(`faculty update failed: ${err.message}`);
      return res.status(500).send({ message: "Failed to update faculty." });
    }
  };

  exports.remove = async (req, res) => {
    try {
      const facultyId = parseInt(req.params.facultyId, 10);
      if (Number.isNaN(facultyId)) {
        return res.status(400).send({ message: "Invalid faculty id." });
      }
  
      const existing = await db.faculty.findByPk(facultyId);
      if (!existing) {
        return res.status(404).send({
          message: `Faculty with id=${facultyId} not found.`,
        });
      }
  
      await existing.destroy();
  
      return res.status(200).send({ message: "Faculty deleted." });
    } catch (err) {
      logger.error(`faculty delete failed: ${err.message}`);
      return res.status(500).send({ message: "Failed to delete faculty." });
    }
  };
  
  export default exports;  