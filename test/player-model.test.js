require('dotenv').config({
    path: 'test.env'
})

const Player = require('../src/models/player')

test('Deletes the existing test Player database models.', async () => {
    await Player.deleteAllAsync()
    const players = await Player.findAll()
    expect(players.length).toBe(0)
})

test('The database can save many and query test Player models.', async () => {
    // create the entities
    const entitiesToCreate = 3
    for (let i = 0; i < entitiesToCreate; i++) {
        await Player.upsertAsync(i, {
            fullName: `Player${i}`
        })
    }
    const players = await Player.findAll()
    expect(players.length).toBe(entitiesToCreate)
})

test('The Player data can perform upsert with data persistence.', async () => {
    let player = null
    const playerId = 999
    await Player.upsertAsync(playerId, {
        fullName: 'first'
    })
    player = await Player.getByIdAsync(playerId)
    expect(player.fullName).toBe('first')
    await Player.upsertAsync(playerId, {
        fullName: 'second'
    })
    player = await Player.getByIdAsync(playerId)
    expect(player.fullName).toBe('second')
})

test('The Player can be queried by team id.', async () => {
    const testTeamId = 55
    const testPlayerId = 1999
    await Player.upsertAsync(testPlayerId, {
        teamId: testTeamId,
    })
    const playerArray = await Player.getByTeamIdAsync(testTeamId)
    expect(playerArray).toBeDefined()
    expect(playerArray.length).toBeGreaterThan(0)
    const player = playerArray[0]
    expect(player.id).toBe(testPlayerId)
    expect(player.teamId).toBe(testTeamId)
})

test('Delete the test data.', async () => {
    await Player.deleteAllAsync()
    const players = await Player.findAll()
    expect(players.length).toBe(0)
})