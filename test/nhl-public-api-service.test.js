const testFeed = require('./feed.json')
const NhlPublicApiService = require('../src/nhl-public-api-service')
const nhlApi = new NhlPublicApiService()

test('The NHL Public API base url is correct.', () => {
    expect(nhlApi.baseUrl).toContain('statsapi.web.nhl.com')
})

test('The NHL Public API returns a 404 on a naked route.', async () => {
    const response = await nhlApi.makeGetRequest('')
    expect(response['status']).toBe(404)
})

test('The NHL Public API Today\'s Schedule returns a data payload with a copyright property.', async () => {
    const schedule = await nhlApi.getTodaySchedule()
    expect(schedule['status']).toBe(200)
    expect(schedule['data']['copyright']).toContain('NHL')
})

test('The NHL Public API Play Types returns a list of information.', async () => {
    const playTypes = await nhlApi.getPlayTypes()
    expect(playTypes['status']).toBe(200)
    expect(playTypes['data']).toBeInstanceOf(Array)
    expect(playTypes['data'].length).toBeGreaterThanOrEqual(26)
})

test('The NHL Public API People returns player data.', async () => {
    const player = await nhlApi.getPlayer(8476792)
    expect(player['fullName']).toBe('Torey Krug')
    expect(player['birthStateProvince']).toBe('MI')
})

test('The NHL Public API People Stats returns single season stats data.', async () => {
    const stat = await nhlApi.getPlayerStats(8476792, '20182019')
    expect(stat['hits']).toBe(53)
    expect(stat['goals']).toBe(6)
    console.log(stat)
})

test('The NHL Public API Seasons returns an array of seasons data.', async () => {
    const seasons = await nhlApi.getSeasons()
    expect(seasons.length).toBeGreaterThanOrEqual(100)
})

test('The NHL Public API Get current season may return a season or null.', async () => {
    const season = await nhlApi.getCurrentSeason()
    if (season != null) {
        const now = new Date()
        const fullYearString = String(now.getFullYear())
        expect(season['seasonId']).toContain(fullYearString)
    } else {
        // it is an off season if the current season is null
        expect(season).toBe(null)
    }
})

test('Parse Stats out of a test feed.', async () => {
    const boxscore = testFeed['liveData']['boxscore']
    const homeStats = boxscore['teams']['home']['players']
    const idNum = 8480073
    const idStr = 'ID'.concat(idNum)
    const playerStats = homeStats[idStr]
    expect(playerStats).toBeDefined()
    expect(playerStats['stats']['skaterStats']['hits']).toBe(1)
})