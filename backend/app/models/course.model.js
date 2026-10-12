export default (sequelize, Sequelize) => {
  const Course = sequelize.define("course", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    courseNumber: {
      type: Sequelize.STRING(15),
      allowNull: false,
      unique: true,
    },
    courseName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    courseDescription: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    courseTerm: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });

  return Course;
};
