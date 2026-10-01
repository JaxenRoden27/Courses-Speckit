import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import userModel from "./user.model.js";
import sessionModel from "./session.model.js";
import sectionModel from "./section.model.js";
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize, Sequelize);
db.session = sessionModel(sequelize, Sequelize);
db.section = sectionModel(sequelize, Sequelize);

db.user.hasMany(db.session, {
  foreignKey: "userId",
  as: "sessions",
  onDelete: "CASCADE",
});

db.session.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});

db.section.belongsTo(db.semester, {
  foreignKey: "semesterId",
  as: "semester",
});

db.section.belongsTo(db.course, {
  foreignKey: "courseId",
  as: "course",
});

db.section.belongsTo(db.faculty, {
  foreignKey: "facultyId",
  as: "faculty",
});

export default db;
