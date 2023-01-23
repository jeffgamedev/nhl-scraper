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

/**
 * Player model stores all the data required by the game watcher data scraper service.
 */
class Player extends Model {
  /**
   * Async upserts the player data. This is a workaround for sqlite as it does not support upsert.
   * @param {Number} playerId Player id.
   * @param {Object} properties data properties to save.
   */
  static async upsertAsync(playerId, properties) {
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
  /**
   * Deletes all the player models async.
   */
  static async deleteAllAsync() {
      await this.sync() // sync ensure the table is created
      await this.destroy({
          where: {},
          truncate: true
      })
  }
  /**
   * Async operation gets a player by ID.
   * @param {Number} queryId (player ID)
   * @returns Player entity or null.
   */
  static async getByIdAsync(queryId) {
    return await this.findOne({
        where: {
            id: queryId
        }
    })
  }
  /**
   * Async operation gets players by their team ID.
   * @param {Number} queryId (team ID)
   * @returns an array of player entities.
   */
  static async getByTeamIdAsync(queryId) {
    return await this.findAll({
        where: {
            teamId: queryId
        }
    })
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