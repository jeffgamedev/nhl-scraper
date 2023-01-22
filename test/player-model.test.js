require('dotenv').config({
    path: 'test.env'
})

const Player = require('../src/models/player')

test('Deletes the existing test Player database models.', async () => {
    await Player.deleteAll()
    const players = await Player.findAll()
    expect(players.length).toBe(0)
})

test('The database can save many and query test Player models.', async () => {
    // create the entities
    const entitiesToCreate = 100
    for (var i = 0; i < entitiesToCreate; i++) {
        await Player.upsert(i, {
            fullName: `Player${i}`
        })
    }
    const players = await Player.findAll()
    expect(players.length).toBe(entitiesToCreate)
})

test('The Player data can perform upsert with data persistence.', async () => {
    let player = null
    const playerId = 999
    await Player.upsert(playerId, {
        fullName: 'first'
    })
    player = await Player.findOne({
        where: {
            id: playerId
        }
    })
    expect(player.fullName).toBe('first')
    await Player.upsert(playerId, {
        fullName: 'second'
    })
    player = await Player.findOne({
        where: {
            id: playerId
        }
    })
    expect(player.fullName).toBe('second')
})

test('Delete the test data.', async () => {
    await Player.deleteAll()
    const players = await Player.findAll()
    expect(players.length).toBe(0)
})