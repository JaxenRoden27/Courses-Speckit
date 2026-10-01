export default (sequelize, Sequelize) => {
    const Semester = sequelize.define(
      "semester",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        semester: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        startDate: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        endDate: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      },
      {
        indexes: [{ unique: true, fields: ["userId", "semester"] }],
      }
    );
  
    return Semester;
  };