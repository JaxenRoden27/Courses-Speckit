import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import semesterModel from "./semester.model.js";
import facultyModel from "./faculty.model.js";
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.semester = semesterModel(sequelize, Sequelize);    
db.faculty = facultyModel(sequelize, Sequelize);    //Make sure to keep updating this file
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