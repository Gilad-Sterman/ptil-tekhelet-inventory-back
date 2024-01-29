import mongodb from 'mongodb'
const { ObjectId } = mongodb

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { orderService } from '../order/order.service.js'

export const dyingService = {
    query,
    add,
    // getById,
}

async function query(filterBy = { User: 'Admin' }) {
    const { User } = filterBy
    try {
        const criteria = {}
        if (User) criteria.User = User
        const collection = await dbService.getCollection('Production_Dyeing')
        let dyeOptions = await collection.find(criteria).toArray()
        return dyeOptions
    } catch (err) {
        logger.error('cannot find dye options', err)
        throw err
    }
}

async function add(eventToAdd) {
    try {
        const dye_Kg = eventToAdd.dye / 1000
        const collection = await dbService.getCollection('Production_Dyeing')
        await collection.insertOne(eventToAdd)
        const updatedDyePowder = await decrementDyePowder(dye_Kg)
        return { event: eventToAdd, dyePowder: updatedDyePowder }
    } catch (err) {
        logger.error('cannot insert dying event', err)
        throw err
    }
}

async function decrementDyePowder(dye_Kg) {
    try {
        const dyePowderProduct = await orderService.getBySKU('10000000030')
        const updatedProduct = await orderService.updateInventory(dyePowderProduct, -dye_Kg)
        return updatedProduct.Inventory
    } catch (err) {
        logger.error('cannot decrement dye powder', err)
        throw err
    }

}