const {
  Sequelize,
  DataTypes,
  Model
} = require('sequelize')

const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT,
  storage: process.env.DB_NAME,
  logging: process.env.DB_LOGGING === 'true'
})

class Player extends Model {
  // this is a workaround for sqlite as it does not support upsert
  static async upsert(playerId, properties) {
      await this.sync() // sync ensures the table is created
      await this.findOrCreate({
          where: {
              id: playerId
          }
      })
      await this.update(properties, {
          where: {
              id: playerId
          }
      })
  }
  static async deleteAll() {
      await this.sync() // sync ensure the table is created
      await this.destroy({
          where: {},
          truncate: true
      }) // deletes any existing entries
  }
}

Player.init({
  id: {
      type: DataTypes.INTEGER,
      primaryKey: true
  },
  fullName: {
      type: DataTypes.STRING,
  },
  currentAge: {
      type: DataTypes.INTEGER
  },
  primaryNumber: {
      type: DataTypes.STRING
  },
  teamId: {
      type: DataTypes.INTEGER
  },
  teamName: {
      type: DataTypes.STRING
  },
  position: {
      type: DataTypes.STRING
  },
  assists: {
      type: DataTypes.INTEGER
  },
  goals: {
      type: DataTypes.INTEGER
  },
  hits: {
      type: DataTypes.INTEGER
  },
  points: {
      type: DataTypes.INTEGER
  },
  penaltyMinutes: {
      type: DataTypes.STRING
  },
  currentOpponentTeam: {
      type: DataTypes.INTEGER
  },
}, {
  sequelize, // pass the connection instance
  modelName: 'Player' // table name in the database
})

module.exports = Player