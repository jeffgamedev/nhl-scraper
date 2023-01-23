const ChildProcess = require('child_process')
const NhlPublicApiService = require('../src/nhl-public-api-service')

const nhlApi = new NhlPublicApiService()
const scraperProcess = ChildProcess.fork('src/game-scraper')
const timeoutAsync = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const gameCheckIntervalSeconds = 60 // check every 1 minute for game in-season.
const offSeasonIntervalSeconds = 3600 // check every 1 hour for season change.

let gamesToday = []
let gamesStarted = []
let currentSeason = null

runGameWatchProcessAsync()

/**
 * Async operation. Main entrypoint for the game watch process. Runs the game watcher indefinitely.
 */
async function runGameWatchProcessAsync() {
    console.log('Starting NHL Game Watch Process')
    while (true) {
        await updateGameWatchAsync()
    }
}

/**
 * Async operation that updates the game watcher process.
 * This can be considered one game watcher iteration.
 */
async function updateGameWatchAsync() {
    await updateCurrentSeasonAsync()
    if (currentSeason == null) {
        await timeoutAsync(offSeasonIntervalSeconds)
        return
    }
    await updateGamesTodayAsync()
    tryStartGameFeedScrapers()
    await timeoutAsync(gameCheckIntervalSeconds)
}

/**
 * Tries to start any of the scheduled game scrapers.
 */
function tryStartGameFeedScrapers() {
    for (let i = 0; i < gamesToday.length; i++) {
        tryStartGameScraper(gamesToday[i])
    }
}

/**
 * Checks if a provided game object is live and starts a scraper process if is is not already started.
 * @param {Object} game A game object from today's schedule.
 */
function tryStartGameScraper(game) {
    if (gamesStarted.indexOf(game['gamePk']) >= 0 || game['status']['abstractGameState'] != 'Live') {
        return
    }
    scraperProcess.send(game['link'])
    gamesStarted.push(game['gamePk'])
}

/**
 * Async operation that updates the current in-memory season.
 */
async function updateCurrentSeasonAsync() {
    currentSeason = await nhlApi.getCurrentSeasonAsync()
    const seasonId = currentSeason == null ? 'Off Season' : currentSeason['seasonId']
    console.log('Current season received: '.concat(seasonId))
}

/**
 * Async operation to update today's schedule.
 */
async function updateGamesTodayAsync() {
    const todayScheduleData = await nhlApi.getTodayScheduleAsync()
    if (todayScheduleData == null || !todayScheduleData['data']) {
        gamesToday = []
        console.log('Refreshed today\'s schedule. No games today.')
        return
    }
    if (!Array.isArray(todayScheduleData['data']['dates']) || todayScheduleData['data']['dates'].length == 0) {
        gamesToday = []
        console.log('Refreshed today\'s schedule. No games today.')
        return
    }
    gamesToday = todayScheduleData['data']['dates'][0]['games']
    console.log('Refreshed today\'s schedule. Games received: '.concat(gamesToday.length))
}