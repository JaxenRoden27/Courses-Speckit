import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Register models and associations here as features define them, e.g.:
// import userModel from "./user.model.js";
// db.user = userModel(sequelize, Sequelize);

export default db;
