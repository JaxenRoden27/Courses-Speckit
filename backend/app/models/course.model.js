export default (sequelize, Sequelize) => {
    const Course = sequelize.define(
      "course",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        courseName: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        term: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        description: {
          type: Sequelize.STRING(255),
        },
        sections: {
          type: Sequelize.JSON,
          allowNull: false,
          defaultValue: [],
        },
      },
      {
        indexes: [{ unique: true, fields: ["courseName"] }],
      }
    );
  
    return Course;
  };