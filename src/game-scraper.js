require('dotenv').config()

const Player = require('../src/models/player')
const NhlPublicApiService = require('../src/nhl-public-api-service')
const nhlApi = new NhlPublicApiService()
const timeout = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));
const gameCheckIntervalSeconds = 20 // refresh every interval
const verbose = process.env.VERBOSE_SCRAPER === 'true'
let dbQueue = []

process.on('message', function(gameFeedUrl) {
    runGameScrapeProcess(String(gameFeedUrl))
})

processDbQueue()

async function processDbQueue() {
    while (true) {
        if (dbQueue.length == 0) {
            await timeout(3)
            continue
        }
        const val = dbQueue.pop()
        const playerId = val[0]
        const playerData = val[1]
        if (verbose) {
            console.log('Saving player data '.concat(JSON.stringify(playerData)))
        }
        await Player.upsert(playerId, playerData)
    }
}

async function runGameScrapeProcess(gameFeedUrl) {
    console.log('Start Game Scraper process: '.concat(gameFeedUrl))
    let gameActive = true
    while (gameActive) {
        gameActive = await updateGameScrapeCheck(gameFeedUrl)
        await timeout(gameCheckIntervalSeconds)
    }
    console.log('Game scraper service ending: '.concat(gameFeedUrl))
}

async function updateGameScrapeCheck(gameFeedUrl) {
    return await updateCurrentGameFeed(gameFeedUrl)
}

// update the game check while on-season
async function updateCurrentGameFeed(gameFeedUrl) {
    const gameFeed = await nhlApi.getGameFeed(gameFeedUrl)
    if (!gameFeed || !gameFeed['data'] || !gameFeed['data']['gameData']) {
        console.log('Invalid game feed response, quitting scraper: '.concat(gameFeedUrl))
        return false
    }
    const gameData = gameFeed['data']['gameData']
    if (gameData['status']['abstractGameState'] != 'Live') {
        console.log('Game has ended. Shutting down scraper: '.concat(gameFeedUrl))
        return false
    }
    const currentSeason = gameData['game']['season']
    const boxscore = gameFeed['data']['liveData']['boxscore']
    const homeStats = boxscore['teams']['home']['players']
    const awayStats = boxscore['teams']['away']['players']
    await scrapeAllPlayerData(gameData['players'], gameData['teams'], homeStats, awayStats, currentSeason)
    return true
}

async function scrapeAllPlayerData(playersDict, teams, homeStats, awayStats, currentSeason) {
    const playerKeys = Object.keys(playersDict)
    for (let i = 0; i < playerKeys.length; i++) {
        let playerKey = playerKeys[i]
        let player = playersDict[playerKey]
        await scrapePlayerData(player, teams, homeStats, awayStats, currentSeason)
        await timeout(0.2)
    }
}

async function scrapePlayerData(player, teams, homeStats, awayStats, currentSeason) {
    let playerId = player['id']
    const strId = 'ID'.concat(playerId)
    let stats = null
    if (homeStats[strId]) {
        stats = homeStats[strId]['stats']['skaterStats']
    } else if (awayStats[strId]) {
        stats = awayStats[strId]['stats']['skaterStats']
    }
    let homeTeamId = teams['home']['id']
    let awayTeamId = teams['away']['id']
    let playerTeamId = player['currentTeam']['id']
    let data = {
        'fullName': player['fullName'],
        'currentAge': player['currentAge'],
        'primaryNumber': player['primaryNumber'],
        'position': player['primaryPosition']['name'],
        'teamId': playerTeamId,
        'teamName': player['currentTeam']['name'],
        'currentOpponentTeam': (homeTeamId == playerTeamId) ? awayTeamId : homeTeamId
    }
    if (stats) {
        data['hits'] = stats['hits']
        data['goals'] = stats['goals']
        data['points'] = stats['points']
        data['assists'] = stats['assists']
        data['penaltyMinutes'] = stats['penaltyMinutes']
    }
    // points is not in the live feed.. so we need to scrape it from the season stats endpoint.
    const playerSeasonStats = await nhlApi.getPlayerStats(playerId, currentSeason)
    data['points'] = 0
    if (playerSeasonStats) {
        data['points'] = playerSeasonStats['points']
    }
    // await Player.upsert(playerId, player)
    dbQueue.push([playerId, data])
}