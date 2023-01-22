require('dotenv').config()
require('child_process').fork('src/game-watch')
const http = require('http')
const Player = require('../src/models/player')
const hostname = process.env.SERVER_HOSTNAME
const port = parseInt(process.env.SERVER_PORT)

async function serveIdEndpoint(url, res, origin) {
    let queryId = String(url)
    queryId = queryId.replace(origin, '')
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    const players = await Player.findAll({
        where: {
            teamId: queryTeamId
        }
    })
    res.end(JSON.stringify(players))
    return
}

function getIdFromUrl(url, name) {
    let queryId = String(url)
    queryId = queryId.replace(name, '')
    return queryId
}

function writeJsonResult(res, payload) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(payload))
}

const server = http.createServer(async (req, res) => {
    let url = req.url
    if (url.indexOf('/team/') != -1) {
        let queryId = getIdFromUrl(url, '/team/')
        const players = await Player.findAll({
            where: {
                teamId: queryId
            }
        })
        writeJsonResult(res, players)
        return
    } else if (url.indexOf('/player/') != -1) {
        let queryId = getIdFromUrl(url, '/player/')
        const players = await Player.findAll({
            where: {
                id: queryId
            }
        })
        writeJsonResult(res, players)
        return
    }
    writeJsonResult(res, {
        'message': 'NHL Data Ingestor API'
    })
})

server.listen(port, hostname, () => {
    console.log(`NHL Data Ingestor server running at http://${hostname}:${port}/`)
})