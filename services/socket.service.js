import { userService } from '../api/user/user.service.js'
import { logger } from './logger.service.js'
import { Server } from 'socket.io'

var gIo = null

export function setupSocketAPI(http) {
    gIo = new Server(http, {
        cors: {
            origin: '*',
        }
    })
    gIo.on('connection', socket => {
        logger.info(`New connected socket [id: ${socket.id}]`)
        socket.on('disconnect', socket => {
            logger.info(`Socket disconnected [id: ${socket.id}]`)
        })

        socket.on('send-invite', async (data) => {
            const fromUser = data.currUser
            const { userEmail } = data
            const toUser = await userService.getByEmail(userEmail)
            if (!toUser) {
                return
            }
            const toUserId = toUser._id
            logger.info(`New invitation from socket [id: ${socket.id}], emitting to user ${toUser.fullname}`)
            emitToUser({ type: 'invite-request', data: fromUser, userId: toUserId })
        })
        socket.on('request-status', answer => {
            const userId = answer.user._id
            logger.info(`New answer from socket [id: ${socket.id}], emitting to user ${userId}`)
            emitToUser({ type: 'invite-answer', data: answer, userId })
        })
        socket.on('play-station', request => {
            const userId = request.user?._id
            if (!userId) {
                return
            }
            logger.info(`User played station from socket [id: ${socket.id}], emitting to all except user ${userId}`)
            broadcast({ type: 'station-playing', data: request, userId })
        })
        socket.on('pause-station', request => {
            const userId = request.user?._id
            if (!userId) {
                return
            }
            logger.info(`User played station from socket [id: ${socket.id}], emitting to all except user ${userId}`)
            broadcast({ type: 'station-paused', data: request, userId })
        })


        socket.on('set-user-socket', userId => {
            logger.info(`Setting socket.userId = ${userId} for socket [id: ${socket.id}]`)
            socket.userId = userId
        })
        socket.on('unset-user-socket', () => {
            logger.info(`Removing socket.userId for socket [id: ${socket.id}]`)
            delete socket.userId
        })

    })
}

function emitTo({ type, data, label }) {
    if (label) gIo.to('watching:' + label.toString()).emit(type, data)
    else gIo.emit(type, data)
}

async function emitToUser({ type, data, userId }) {
    userId = userId.toString()
    const socket = await _getUserSocket(userId)

    if (socket) {
        logger.info(`Emiting event: ${type} to user: ${userId} socket [id: ${socket.id}]`)
        socket.emit(type, data)
    } else {
        logger.info(`No active socket for user: ${userId}`)
    }
}


async function broadcast({ type, data, room = null, userId }) {
    userId = userId.toString()
    logger.info(`Broadcasting event: ${type}`)
    const excludedSocket = await _getUserSocket(userId)
    if (room && excludedSocket) {
        logger.info(`Broadcast to room ${room} excluding user: ${userId}`)
        excludedSocket.broadcast.to(room).emit(type, data)
    } else if (excludedSocket) {
        logger.info(`Broadcast to all excluding user: ${userId}`)
        excludedSocket.broadcast.emit(type, data)
    } else if (room) {
        logger.info(`Emit to room: ${room}`)
        gIo.to(room).emit(type, data)
    } else {
        logger.info(`Emit to all`)
        gIo.emit(type, data)
    }
}

async function _getUserSocket(userId) {
    const sockets = await _getAllSockets()
    const socket = sockets.find(s => s.userId === userId)
    return socket
}
async function _getAllSockets() {
    const sockets = await gIo.fetchSockets()
    return sockets
}

export const socketService = {
    setupSocketAPI,
    emitTo,
    emitToUser,
    broadcast,
}
