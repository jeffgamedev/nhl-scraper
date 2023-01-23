const http = require('http')
const Player = require('../src/models/player')

const hostname = process.env.SERVER_HOSTNAME
const port = parseInt(process.env.SERVER_PORT)

const server = http.createServer(async (req, res) => {
    const url = req.url
    if (url.indexOf('/team/') != -1) {
        const queryId = getIdFromUrl(url, '/team/')
        const players = await Player.getByTeamIdAsync(queryId)
        JsonResponse(res, players)
        return
    } else if (url.indexOf('/player/') != -1) {
        const queryId = getIdFromUrl(url, '/player/')
        const players = await Player.getByIdAsync(queryId)
        JsonResponse(res, players)
        return
    }
    JsonResponse(res, {
        'message': 'NHL Data Ingestor API'
    })
})

/**
 * Parses an id out of an http endpoint, removing the provided name parameter from the string.
 * @param {String} url String of the endpoint url.
 * @param {String} name String name to remove from url to parse value from.
 * @returns parsed query id string.
 */
function getIdFromUrl(url, name) {
    let queryId = String(url)
    queryId = queryId.replace(name, '')
    return queryId
}

/**
 * Writes a JSON response to the HTTP response object.
 * @param {Object} res Response HTTP object.
 * @param {Object} payload data payload is returned as JSON.
 */
function JsonResponse(res, payload) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(payload))
}

/**
 * Runs the HTTP Server.
 */
function runHttpServer() {
    server.listen(port, hostname, () => {
        console.log(`NHL Data Ingestor server running at http://${hostname}:${port}/`)
    })
}

module.exports = runHttpServer