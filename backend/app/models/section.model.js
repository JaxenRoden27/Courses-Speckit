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
            type: Sequelize.STRING(10),
            allowNull: false,
        },
        courseId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        facultyId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        daysOfWeek: {
            type: Sequelize.STRING(10),
            allowNull: false,
        },
        startTime: {
            type: Sequelize.TIME,
            allowNull: false,
        },
        endTime: {
            type: Sequelize.TIME,
            allowNull: false,
        },
      },
      {
        indexes: [{ unique: true, fields: ["courseId", "sectionNumber"] }],
      }
    );
  
    return Section;
  };