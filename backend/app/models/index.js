import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import semesterModel from "./semester.model.js";
import sectionModel from "./section.model.js";
import facultyModel from "./faculty.model.js";
import courseModel from "./course.model.js";
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.semester = semesterModel(sequelize, Sequelize);
db.section = sectionModel(sequelize, Sequelize);    //Make sure to keep updating this file
db.semester = semesterModel(sequelize, Sequelize);    
db.faculty = facultyModel(sequelize, Sequelize);    //Make sure to keep updating this file
db.semester = semesterModel(sequelize, Sequelize);
db.course = courseModel(sequelize, Sequelize);

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

db.section.belongsTo(db.course, {
  foreignKey: "courseId",
  as: "course",
  onDelete: "RESTRICT",
});

db.section.belongsTo(db.faculty, {
  foreignKey: "facultyId",
  as: "faculty",
  onDelete: "RESTRICT",
});

db.faculty.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
  onDelete: "SET NULL",
});

db.user.hasOne(db.faculty, {
  foreignKey: "userId",
  as: "faculty",
});

export default db;
