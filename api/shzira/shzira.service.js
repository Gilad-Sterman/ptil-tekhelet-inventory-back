import mongodb from 'mongodb'
const { ObjectId } = mongodb

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'

export const shziraService = {
    query,
    add,
}

async function query(filterBy = { User: 'Admin' }) {
    const { User } = filterBy
    try {
        const criteria = {}
        if (User) criteria.User = User
        const collection = await dbService.getCollection('Production_Shezira')
        let shziraOptions = await collection.find(criteria).toArray()
        return shziraOptions
    } catch (err) {
        logger.error('cannot find shzira options', err)
        throw err
    }
}

async function add(eventToAdd) {
    try {
        const collection = await dbService.getCollection('Production_Shezira')
        await collection.insertOne(eventToAdd)
        return eventToAdd
    } catch (err) {
        logger.error('cannot insert shzira event', err)
        throw err
    }
}