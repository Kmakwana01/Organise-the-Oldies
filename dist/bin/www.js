#!/usr/bin/env node
"use strict";
/**
 * Module dependencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var app = require('../app');
var debug = require('debug')('typescript:server');
var http = require('http');
const socket_io_1 = require("socket.io");
/**
 * Get port from environment and store in Express.
 */
require('dotenv').config();
var port = normalizePort(process.env.PORT || '3000');
console.log(port);
app.set('port', port);
/**
 * Create HTTP server.
 */
var server = http.createServer(app);
const sIo = new socket_io_1.Server(server, {
    cors: {
        origin: '*'
    }
});
const socket_1 = require("../socket");
let ssIo = (0, socket_1.io)(sIo);
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}
/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}
/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
