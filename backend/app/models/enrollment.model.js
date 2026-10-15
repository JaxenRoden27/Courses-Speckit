export default (sequelize, Sequelize) => {
    const Enrollment = sequelize.define(
      "enrollment",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        sectionId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        semesterId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        studentId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      },
      {
        indexes: [{ unique: true, fields: ["studentId", "sectionId"] }],
      }
    );
  
    return Enrollment;
  };