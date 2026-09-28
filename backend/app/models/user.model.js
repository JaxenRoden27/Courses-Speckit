export default (sequelize, Sequelize) => {
    const User = sequelize.define(
      "user",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        fName: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        lName: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        universityId: {
          type: Sequelize.STRING(6),
          allowNull: false,
          unique: true,
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        role: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: "student",
        },
      },
      {
        defaultScope: {
          attributes: { exclude: ["password"] },
        },
        hooks: {
          beforeValidate(user) {
            if (user.universityId) {
              user.universityId = user.universityId.trim().toLowerCase();
            }
          },
        },
      }
    );
  
    return User;
  };
  