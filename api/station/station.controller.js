import { logger } from "../../services/logger.service.js";
import { socketService } from "../../services/socket.service.js";
import { stationService } from "./station.service.js";


export async function getStations(req, res) {
    try {
        const tags = (req.query.tags) ? req.query.tags.split(',') : 'all'
        const likedByUsers = req.query.likedByUsers.split(',')
        const filterBy = {
            txt: req.query.txt || '',
            sortBy: req.query.sortBy || 'name',
            likedByUsers,
            tags,
        }
        logger.debug('Getting stations', filterBy)
        console.log('Getting stations', filterBy)
        const stations = await stationService.query(filterBy)
        res.json(stations)
    } catch (err) {
        logger.error('Failed to get stations', err)
        console.log('Failed to get stations', err)
        res.status(500).send({ err: 'Failed to get stations' })
    }
}

export async function getStationById(req, res) {
    try {
        const stationId = req.params.id
        const station = await stationService.getById(stationId)
        res.json(station)
    } catch (err) {
        logger.error('Failed to get station', err)
        res.status(500).send({ err: 'Failed to get station' })
    }
}

export async function addStation(req, res) {
    // const { loggedinUser } = req

    try {
        const station = req.body
        // station.owner = loggedinUser
        const addedStation = await stationService.add(station)
        // socketService.broadcast({ type: 'station-added', data: addedStation, userId: loggedinUser._id })
        res.json(addedStation)
    } catch (err) {
        logger.error('Failed to add station', err)
        res.status(500).send({ err: 'Failed to add station' })
    }
}

export async function updateStation(req, res) {
    const { loggedinUser } = req
    try {
        const station = req.body
        // console.log(station)
        const updatedStation = await stationService.update(station)
        socketService.broadcast({ type: 'station-updated', data: updatedStation, userId: loggedinUser._id })
        res.json(updatedStation)
    } catch (err) {
        logger.error('Failed to update station', err)
        res.status(500).send({ err: 'Failed to update station' })
    }
}

export async function removeStation(req, res) {
    // const { loggedinUser } = req
    try {
        const stationId = req.params.id
        await stationService.remove(stationId)
        // socketService.broadcast({ type: 'station-removed', data: stationId, userId: loggedinUser._id })
        res.send()
    } catch (err) {
        logger.error('Failed to remove station', err)
        res.status(500).send({ err: 'Failed to remove station' })
    }
}