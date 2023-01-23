const Player = require('../src/models/player')
const NhlPublicApiService = require('../src/nhl-public-api-service')

const nhlApi = new NhlPublicApiService()
const timeoutAsync = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const gameCheckIntervalSeconds = 20
const verbose = process.env.VERBOSE_SCRAPER === 'true'

let dbQueue = []

// entry point for individual game feed scrape routine.
process.on('message', function(gameFeedUrl) {
    runGameScrapeProcessAsync(String(gameFeedUrl))
})

// entry point for the database insertion queue.
processDbQueueAsync()

/**
 * Async operation that processes the database queue.
 * This process runs indefinitely and watches for database insertion requests.
 * This allows the database to not lock up.
 */
async function processDbQueueAsync() {
    while (true) {
        if (dbQueue.length == 0) {
            await timeoutAsync(3)
            continue
        }
        const val = dbQueue.pop()
        const playerId = val[0]
        const playerData = val[1]
        if (verbose) {
            console.log('Saving player data '.concat(JSON.stringify(playerData)))
        }
        await Player.upsertAsync(playerId, playerData)
    }
}

/**
 * Async operation that scrapes from a game feed while it is still 'Live'.
 * @param {String} gameFeedUrl The game feed url to retrieved data from.
 */
async function runGameScrapeProcessAsync(gameFeedUrl) {
    console.log('Start Game Scraper process: '.concat(gameFeedUrl))
    while (await updateCurrentGameFeedAsync(gameFeedUrl)) {
        await timeoutAsync(gameCheckIntervalSeconds)
    }
    console.log('Shutting down feed scraper service: '.concat(gameFeedUrl))
}

/**
 * Async operation that updates the current game feed, making a data request to
 * the endpoint and storing each player info and stats provided by the feed in the database.
 * @param {String} gameFeedUrl The game feed url to retrieved data from.
 * @returns true if the feed is still active, otherwise false.
 */
async function updateCurrentGameFeedAsync(gameFeedUrl) {
    const gameFeed = await nhlApi.makeGetRequestAsync(gameFeedUrl)
    if (!gameFeed || !gameFeed['data'] || !gameFeed['data']['gameData']) {
        console.log('Invalid game feed response, quitting scraper: '.concat(gameFeedUrl))
        return false
    }
    const gameData = gameFeed['data']['gameData']
    if (gameData['status']['abstractGameState'] != 'Live') {
        console.log('Game has ended: '.concat(gameFeedUrl))
        return false
    }
    const currentSeason = gameData['game']['season']
    const boxscore = gameFeed['data']['liveData']['boxscore']
    await scrapeAllPlayerDataAsync(gameData, boxscore, currentSeason)
    return true
}

/**
 * Async operation that scrapes all player data from the provided dictionaries.
 * @param {Object} gameData the game data ditionary from the live stream.
 * @param {Object} boxscore the boxscore stats dictionary from the live stream.
 * @param {String} currentSeason the current season string id.
 */
async function scrapeAllPlayerDataAsync(gameData, boxscore, currentSeason) {
    const teams = gameData['teams']
    const playersDict = gameData['players']
    const playerKeys = Object.keys(playersDict)
    for (let i = 0; i < playerKeys.length; i++) {
        let playerKey = playerKeys[i]
        let player = playersDict[playerKey]
        await scrapePlayerDataAsync(player, teams, boxscore, currentSeason)
        await timeoutAsync(0.2)
    }
}

/**
 * Async operation to store the provided player data from a live stream.
 * Finds the player's live feed stats from the boxscore and opposing team from the teams.
 * @param {Object} player the player dictionary of data to store.
 * @param {Object} teams the teams dictionary from the live stream.
 * @param {Object} boxscore the boxscore stats dictionary from the live stream.
 * @param {String} currentSeason the current season string id.
 */
async function scrapePlayerDataAsync(player, teams, boxscore, currentSeason) {
    const playerId = player['id']
    const playerStrId = 'ID'.concat(playerId)
    const homeTeamId = teams['home']['id']
    const awayTeamId = teams['away']['id']
    const homeStats = boxscore['teams']['home']['players']
    const awayStats = boxscore['teams']['away']['players']
    const playerTeamId = player['currentTeam']['id']
    let data = {
        'fullName': player['fullName'],
        'currentAge': player['currentAge'],
        'primaryNumber': player['primaryNumber'],
        'position': player['primaryPosition']['name'],
        'teamId': playerTeamId,
        'teamName': player['currentTeam']['name'],
        'currentOpponentTeam': (homeTeamId == playerTeamId) ? awayTeamId : homeTeamId
    }
    let stats = null
    if (homeStats[playerStrId]) {
        stats = homeStats[playerStrId]['stats']['skaterStats']
    } else if (awayStats[playerStrId]) {
        stats = awayStats[playerStrId]['stats']['skaterStats']
    }
    if (stats) {
        data['hits'] = stats['hits']
        data['goals'] = stats['goals']
        data['points'] = stats['points']
        data['assists'] = stats['assists']
        data['penaltyMinutes'] = stats['penaltyMinutes']
    }
    // points is not in the live feed.. so we need to scrape it from the season stats endpoint.
    data['points'] = 0
    const playerSeasonStats = await nhlApi.getPlayerStatsAsync(playerId, currentSeason)
    if (playerSeasonStats) {
        data['points'] = playerSeasonStats['points']
    }
    // Queue the data for storage when the database is ready.
    dbQueue.push([playerId, data])
}