import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import semesterModel from "./semester.model.js";
import sectionModel from "./section.model.js";
import enrollmentModel from "./enrollment.model.js";
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.semester = semesterModel(sequelize, Sequelize);
db.section = sectionModel(sequelize, Sequelize);
db.enrollment = enrollmentModel(sequelize, Sequelize);    //Make sure to keep updating this file

db.user.hasMany(db.session, {
  foreignKey: "userId",
  as: "sessions",
  onDelete: "CASCADE",
});

db.session.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});

db.semester.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});

db.user.hasMany(db.semester, {
  foreignKey: "userId",
  as: "semesters",
  onDelete: "CASCADE",
});

db.enrollment.belongsTo(db.section, {
  foreignKey: "sectionId",
  as: "section",
  onDelete: "RESTRICT",
});

db.enrollment.belongsTo(db.semester, {
  foreignKey: "semesterId",
  as: "semester",
  onDelete: "RESTRICT",
});

db.enrollment.belongsTo(db.user, {
  foreignKey: "studentId",
  as: "student",
  onDelete: "RESTRICT",
});

db.section.hasMany(db.enrollment, {
  foreignKey: "sectionId",
  as: "enrollments",
  onDelete: "RESTRICT",
});

db.semester.hasMany(db.enrollment, {
  foreignKey: "semesterId",
  as: "enrollments",
  onDelete: "RESTRICT",
});

db.user.hasMany(db.enrollment, {
  foreignKey: "studentId",
  as: "enrollments",
  onDelete: "RESTRICT",
});

export default db;
