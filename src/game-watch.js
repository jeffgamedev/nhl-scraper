const childProcess = require('child_process')
const NhlPublicApiService = require('../src/nhl-public-api-service')

const nhlApi = new NhlPublicApiService()
const timeout = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const gameCheckIntervalSeconds = 60 // check every 1 minute for game in-season
const offSeasonIntervalSeconds = 3600 // check every 1 hour for game off-season
const scraperProcess = childProcess.fork('src/game-scraper')

let currentSeason = null
let gamesToday = []
let gamesStarted = []

runGameCheckProcess()

async function runGameCheckProcess() {
    console.log('Starting NHL Game Watch Process')
    while (true) {
        await updateGameCheck()
    }
}

async function updateGameCheck() {
    await updateCurrentSeason()
    if (currentSeason == null) {
        await timeout(offSeasonIntervalSeconds)
    } else {
        await updateInSeason()
    }
}

// update the game check while in-season
async function updateInSeason() {
    await updateGamesToday()
    await checkStartGameDataScraper()
    await timeout(gameCheckIntervalSeconds)
    await updateCurrentSeason()
}

async function checkStartGameDataScraper() {
    for (let i = 0; i < gamesToday.length; i++) {
        const game = gamesToday[i]
        if (gamesStarted.indexOf(game['gamePk']) >= 0) {
            continue
        }
        if (game['status']['abstractGameState'] == 'Live') {
            startGameScraper(game)
        }
        await timeout(1)
    }
}

function startGameScraper(game) {
    scraperProcess.send(game['link'])
    gamesStarted.push(game['gamePk'])
}

// updates the in-memory current season property.
async function updateCurrentSeason() {
    console.log('Getting current season...')
    currentSeason = await nhlApi.getCurrentSeason()
    var seasonId = currentSeason == null ? 'Off Season' : currentSeason['seasonId']
    console.log('Current season received: '.concat(seasonId))
}

// updates the in-memory current games today property.
async function updateGamesToday() {
    console.log('Refreshing today\'s schedule...')
    const todayScheduleData = await nhlApi.getTodaySchedule()
    if (todayScheduleData == null || !todayScheduleData['data']) {
        gamesToday = []
        console.log('No games today.')
        return
    }
    if (!Array.isArray(todayScheduleData['data']['dates']) || todayScheduleData['data']['dates'].length == 0) {
        gamesToday = []
        console.log('No games today.')
        return
    }
    gamesToday = todayScheduleData['data']['dates'][0]['games']
    console.log('Today\'s games received: '.concat(gamesToday.length))
}