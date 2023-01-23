const axios = require('axios')

class NhlPublicApiService {
    constructor() {
        this.baseUrl = 'https://statsapi.web.nhl.com'
    }
    /**
     * Async request against the NHL API at the provided path.
     * @param {String} path NHL API path string, eg "/v1/api/..."
     * @returns the request response
     */
    async makeGetRequestAsync(path) {
        try {
            path = this.baseUrl.concat(path)
            return await axios.get(path)
        } catch (error) {
            return error.response
        }
    }
    /**
     * Async requests the NHL API schedule for today.
     * @returns The NHL API schedule for today.
     */
    async getTodayScheduleAsync() {
        return await this.makeGetRequestAsync('/api/v1/schedule')
    }
    /**
     * Async requests the NHL API game status types.
     * @returns The NHL API game status types.
     */
    async getGameStatusAsync() {
        return await this.makeGetRequestAsync('/api/v1/gameStatus')
    }
    /**
     * Async request for the NHL API seasons data.
     * @returns NHL API seasons data.
     */
    async getSeasonsAsync() {
        const result = await this.makeGetRequestAsync('/api/v1/seasons')
        const data = result['data']
        if (data && Array.isArray(data['seasons'])) {
            return data['seasons']
        }
        return []
    }
    /**
     * Async request for the current season ID.
     * @returns the current NHL season ID or null.
     */
    async getCurrentSeasonAsync() {
        const now = new Date()
        const nowTime = now.getTime()
        const seasons = await this.getSeasonsAsync()
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
    /**
     * Async request for a player's information.
     * @param {Number} id Player ID.
     * @returns Player information or null.
     */
    async getPlayerAsync(id) {
        const result = await this.makeGetRequestAsync('/api/v1/people/'.concat(String(id)))
        const data = result['data']
        if (data && Array.isArray(data['people']) && data['people'].length > 0) {
            return result['data']['people'][0]
        }
        return null
    }
    /**
     * Async request for a player's stats during a season.
     * @param {Number} id player id
     * @param {String} season season ID
     * @returns Player stats or null.
     */
    async getPlayerStatsAsync(id, season) {
        let uri = '/api/v1/people/'.concat(String(id).concat('/stats'))
        uri = uri.concat('?stats=statsSingleSeason&season='.concat(season))
        const result = await this.makeGetRequestAsync(uri)
        const data = result['data']
        if (!data || !Array.isArray(data['stats']) || data['stats'].length == 0 || data['stats'][0].length == 0) {
            return null
        }
        if (data['stats'][0]['splits'].length == 0) {
            return null
        }
        return data['stats'][0]['splits'][0]['stat']
    }
    /**
     * Async request for the play types data.
     * @returns The NHL API play types data.
     */
    async getPlayTypesAsync() {
        return await this.makeGetRequestAsync('/api/v1/playTypes')
    }
}

module.exports = NhlPublicApiService