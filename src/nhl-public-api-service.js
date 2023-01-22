const axios = require('axios')

class NhlPublicApiService {
    constructor() {
        this.baseUrl = 'https://statsapi.web.nhl.com'
    }
    async makeGetRequest(path) {
        try {
            path = this.baseUrl.concat(path)
            return await axios.get(path)
        } catch (error) {
            return error.response
        }
    }
    async getTodaySchedule() {
        return await this.makeGetRequest('/api/v1/schedule')
    }
    async getGameStatus() {
        return await this.makeGetRequest('/api/v1/gameStatus')
    }
    async getSeasons() {
        const result = await this.makeGetRequest('/api/v1/seasons')
        const data = result['data']
        if (data && Array.isArray(data['seasons'])) {
            return data['seasons']
        }
        return []
    }
    async getCurrentSeason() {
        const now = new Date()
        const nowTime = now.getTime()
        const seasons = await this.getSeasons()
        for (let i = 0; i < seasons.length; i++) {
            const season = seasons[i]
            const endDate = new Date(season['regularSeasonEndDate'])
            const startDate = new Date(season['regularSeasonStartDate'])
            if (nowTime >= startDate.getTime() && nowTime <= endDate.getTime()) {
                return season
            }
        }
        return null
    }
    async getPlayer(id) {
        const result = await this.makeGetRequest('/api/v1/people/'.concat(String(id)))
        const data = result['data']
        if (data && Array.isArray(data['people']) && data['people'].length > 0) {
            return result['data']['people'][0]
        }
        return null
    }
    async getPlayerStats(id, season) {
        let uri = '/api/v1/people/'.concat(String(id).concat('/stats'))
        uri = uri.concat('?stats=statsSingleSeason&season='.concat(season))
        const result = await this.makeGetRequest(uri)
        const data = result['data']
        if (!data || !Array.isArray(data['stats']) || data['stats'].length == 0 || data['stats'][0].length == 0) {
            return null
        }
        if (data['stats'][0]['splits'].length == 0) {
            return null
        }
        return data['stats'][0]['splits'][0]['stat']
    }
    async getPlayTypes() {
        return await this.makeGetRequest('/api/v1/playTypes')
    }
    async getGameFeed(feedUrl) {
        return await this.makeGetRequest(feedUrl)
    }
}

module.exports = NhlPublicApiService