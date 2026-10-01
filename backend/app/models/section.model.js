export default (sequelize, Sequelize) => {
    const Section = sequelize.define(
      "section",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        sectionNumber: {
          type: Sequelize.STRING(2),
          allowNull: false,
        },
        semesterId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        courseId: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        facultyId: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        daysOfWeek: {
          type: Sequelize.STRING(10),
          allowNull: true,
        },
        startTime: {
          type: Sequelize.TIME,
          allowNull: true,
        },
        endTime: {
          type: Sequelize.TIME,
          allowNull: true,
        },
      },
      {
        indexes: [{ unique: true, fields: ["courseId", "sectionNumber"] }],
      }
    );
  
    return Section;
  };