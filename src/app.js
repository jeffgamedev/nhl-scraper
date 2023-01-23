require('dotenv').config()

const RunHttpServer = require('./server')
const ChildProcess = require('child_process')

// main application entrypoint
runGameWatchAPI()

/**
 * Runs the Game Watcher API. Starts the game watcher child process and runs the HTTP server.
 */
function runGameWatchAPI() {
    ChildProcess.fork('src/game-watch') // start the game watch process
    RunHttpServer() // start the restful server
}