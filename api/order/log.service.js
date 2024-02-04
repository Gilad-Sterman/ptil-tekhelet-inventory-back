import mongodb from 'mongodb'
const { ObjectId } = mongodb

import { dbService } from '../../services/db.service.js'

export const logService = {
    addNewLog,
    addNewIcountLog
    // deleteMany
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

async function addNewIcountLog({ quantity, products, SKUs }) {
    try {
        const logToAdd = {
            date: new Date,
            type: 'New From Icount',
            products, 
            SKUs,
            quantity,
        }
        const collection = await dbService.getCollection('logs')
        await collection.insertOne(logToAdd)
        return logToAdd
    } catch (err) {
        logger.error('cannot insert log', err)
        throw err
    }
}

async function deleteMany(){
    try {
        const collection = await dbService.getCollection('logs')
        await collection.deleteMany({description: "Updated 10000000001 - Inventory: 23 - Location: A-120"})
    } catch (err) {
        logger.error('cannot delete logs', err)
        throw err
    }
}