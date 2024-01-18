import mongodb from 'mongodb'
const { ObjectId } = mongodb

import { dbService } from '../../services/db.service.js'

export const logService = {
    addNewLog
}

async function addNewLog({ type, userName, amount, description, products, SKUs }) {
    try {
        const logToAdd = {
            date: new Date,
            type,
            userName: userName || 'no-user',
            description,
            SKUs,
            amount,
        }
        if (products) logToAdd.products = products
        const collection = await dbService.getCollection('logs')
        await collection.insertOne(logToAdd)
        return logToAdd
    } catch (err) {
        logger.error('cannot insert log', err)
        throw err
    }
}