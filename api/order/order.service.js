import mongodb from 'mongodb'
const { ObjectId } = mongodb

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { BEGGED, STRING, TYING } from '../../services/info.service.js'


async function query(filterBy = { txt: '' }) {
    const { from, to, maxNum, sortBy, categories, moreCategories } = filterBy
    try {
        const criteria = {
            LastUpdate: { $gt: from, $lt: to },
            // $or: [
            //     { name: { $regex: filterBy.txt, $options: 'i' } },
            //     { createdBy: { $regex: filterBy.txt, $options: 'i' } }],
        }
        if (maxNum !== '') criteria[' Inventory'] = { $lte: maxNum }
        if (categories) {
            // if(categories.length )
            // criteria['$or'] 
            criteria['$or'] = categories.map(category => {
                if (category === 'other') return { SKU: { $lte: 10000000099 } }
                if (category === 'strings') return {
                    '$and': [
                        {
                            'SKU': {
                                '$lt': 10000900000
                            }
                        }, {
                            'SKU': {
                                '$gt': 10000001000
                            }
                        }
                    ]
                }
                if (category === 'begaddim') {
                    if (moreCategories?.includes('untied')) return { SKU: { $mod: [1000000, 0] } }
                    return { SKU: { $gte: 10145000000 } }
                }
            })
        }
        // if (sortBy) criteria[' Inventory'] = { $lte: maxNum }
        // if (filterBy.likedByUsers !== 'all') criteria.likedByUsers = { $in: filterBy.likedByUsers }

        const collection = await dbService.getCollection('inventory')
        // let orders = await collection.find(criteria).sort({ [sortBy]: 1 }).toArray()
        let orders = await collection.find(criteria).sort({ [sortBy]: 1 }).limit(30).toArray()
        return orders
    } catch (err) {
        logger.error('cannot find orders', err)
        throw err
    }
}

async function getById(orderId) {
    try {
        const collection = await dbService.getCollection('order')
        const order = collection.findOne({ _id: ObjectId(orderId) })
        return order
    } catch (err) {
        logger.error(`while finding order ${orderId}`, err)
        throw err
    }
}

async function getBySKU(productSKU) {
    try {
        const collection = await dbService.getCollection('inventory')
        const product = await collection.findOne({ SKU: productSKU })
        // console.log('product:', product);
        return product
    } catch (err) {
        logger.error(`while finding product ${productSKU}`, err)
        throw err
    }
}

async function updateInventory(product, increment) {
    try {
        const productToSave = {
            SKU: product.SKU,
            'Description-Heb': product['Description-Heb'],
            'Description-Eng': product['Description-Eng'],
            'Inventory': product['Inventory'] + increment,
            'Cost': product['Cost'],
            'Price': product['Price'],
            'USDPrice': product['USDPrice'],
            'MinimumLevel': product['MinimumLevel'],
            LastUpdate: Date.now(),
        }
        const collection = await dbService.getCollection('inventory')
        await collection.updateOne({ _id: ObjectId(product._id) }, { $set: productToSave })
        return productToSave
    } catch (err) {
        logger.error(`cannot update station ${product._id}`, err)
        throw err
    }
}

async function add(productSKU, amount) {
    const beggedHeb = BEGGED.find(begged => begged.code === productSKU.substring(1, 3)).heb
    const beggedEng = BEGGED.find(begged => begged.code === productSKU.substring(1, 3)).eng
    const sizeCode = productSKU.substring(3, 5)
    const stringHeb = STRING.find(string => string.code === productSKU.substring(5, 7)).heb
    const stringEng = STRING.find(string => string.code === productSKU.substring(5, 7)).eng
    const tyingHeb = TYING.find(tying => tying.code === productSKU.substring(7, 9)).heb
    const tyingEng = TYING.find(tying => tying.code === productSKU.substring(7, 9)).eng

    try {
        const productToAdd = {
            SKU: productSKU,
            'Description-Heb': `${beggedHeb}: ${sizeCode} : ${stringHeb} : ${tyingHeb}`,
            'Description-Eng': `${beggedEng}: ${sizeCode} : ${stringEng} : ${tyingEng}`,
            'Inventory': amount,
            'Cost': -0.1,
            'Price': -0.1,
            'USDPrice': -0.1,
            'MinimumLevel': 5,
            LastUpdate: Date.now(),
        }
        const collection = await dbService.getCollection('inventory')
        await collection.insertOne(productToAdd)
        return productToAdd
    } catch (err) {
        logger.error('cannot insert product', err)
        throw err
    }
}


export const orderService = {
    query,
    getById,
    getBySKU,
    updateInventory,
    add
}