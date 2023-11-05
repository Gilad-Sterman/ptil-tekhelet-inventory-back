import mongodb from 'mongodb'
const { ObjectId } = mongodb

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'


async function query(filterBy = { txt: '' }) {
    const { sortBy } = filterBy
    try {
        const criteria = {
            $or: [
                { name: { $regex: filterBy.txt, $options: 'i' } },
                { createdBy: { $regex: filterBy.txt, $options: 'i' } }],
        }
        if (filterBy.tags !== 'all') criteria.tags = { $in: filterBy.tags }
        if (filterBy.likedByUsers !== 'all') criteria.likedByUsers = { $in: filterBy.likedByUsers }

        const collection = await dbService.getCollection('station')
        let stations = await collection.find(criteria).sort({ [sortBy]: 1 }).toArray()
        return stations
    } catch (err) {
        logger.error('cannot find stations', err)
        throw err
    }
}

async function getById(stationId) {
    try {
        const collection = await dbService.getCollection('station')
        const station = collection.findOne({ _id: ObjectId(stationId) })
        return station
    } catch (err) {
        logger.error(`while finding station ${stationId}`, err)
        throw err
    }
}

async function remove(stationId) {
    try {
        const collection = await dbService.getCollection('station')
        await collection.deleteOne({ _id: ObjectId(stationId) })
    } catch (err) {
        logger.error(`cannot remove station ${stationId}`, err)
        throw err
    }
}

async function add(station) {
    try {
        const collection = await dbService.getCollection('station')
        station.createdAt = Date.now()
        await collection.insertOne(station)
        return station
    } catch (err) {
        logger.error('cannot insert station', err)
        throw err
    }
}

async function update(station) {
    try {
        const stationToSave = {
            name: station.name,
            songs: station.songs,
            likedByUsers: station.likedByUsers,
            desc: station.desc,
            tags: station.tags,
            imgUrl: station.imgUrl,
            createdAt: station.createdAt,
            createdBy: station.createdBy
        }
        const collection = await dbService.getCollection('station')
        await collection.updateOne({ _id: ObjectId(station._id) }, { $set: stationToSave })
        return station
    } catch (err) {
        logger.error(`cannot update station ${station._id}`, err)
        throw err
    }
}

export const stationService = {
    remove,
    query,
    getById,
    add,
    update,
}