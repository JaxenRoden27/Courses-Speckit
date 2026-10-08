export default (sequelize, Sequelize) => {
    const Faculty = sequelize.define("faculty", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      firstName: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      dept: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
      },
    });
  
    return Faculty;
  };
  