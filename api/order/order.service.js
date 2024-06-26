import mongodb from 'mongodb'
const { ObjectId } = mongodb

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { BEGGED, STRING, TYING } from '../../services/info.service.js'


async function query(filterBy = { txt: '' }) {
    const { from, to, txt, sortBy, sortDir, maxNum, categories, moreCategories, specificCodes } = filterBy
    try {
        let criteria = {
            $and: [{ LastUpdate: { $gt: from, $lt: to } }],
        }
        if (txt) {
            criteria['$and'].push({
                '$or': [
                    { 'Description-Heb': { $regex: txt.trim(), $options: 'i' } },
                    { 'Description-Eng': { $regex: txt.trim(), $options: 'i' } },
                    { SKU: { $regex: txt.trim(), $options: 'i' } }
                ]
            })
        }
        if (maxNum) criteria['$and'].push({ $expr: { $lt: ['$Inventory', '$MinimumLevel'] } })
        if (categories) {
            const categoriesArr = categories.map(category => {
                if (category === 'other') return { SKU: { $regex: new RegExp('^100.{2}0000.{2}') } }
                if (category === 'strings') return {
                    '$and': [
                        { SKU: { $regex: new RegExp('0000$') } },
                        { SKU: { $regex: new RegExp('^10000') } }
                    ]
                }
                if (category === 'begaddim') {
                    if (!moreCategories || moreCategories.length > 1) {
                        return {
                            '$or': [
                                {
                                    '$and': [
                                        { 'SKU': { '$not': { '$regex': new RegExp('^10000') } } },
                                        { 'SKU': { '$not': { '$regex': new RegExp('0000$') } } }]
                                },
                                { 'SKU': { '$regex': new RegExp('000000$') } }]
                        }
                    }
                    if (moreCategories.includes('untied')) return { SKU: { $regex: new RegExp('000000$') } }
                    return {
                        '$and': [
                            { 'SKU': { '$not': { '$regex': new RegExp('^10000') } } },
                            { 'SKU': { '$not': { '$regex': new RegExp('0000$') } } }
                        ]
                    }
                }
            })
            criteria['$and'].push({ $or: categoriesArr })
        }

        if (specificCodes && categories) {
            if (specificCodes.begged && categories.includes('begaddim')) {
                const codesArr = specificCodes.begged.map(begged => {
                    return { SKU: { $regex: new RegExp(`^1${begged}`) } }
                })
                criteria['$and'].push({ $or: codesArr })
            }

            if (specificCodes.size && (categories.includes('begaddim') || categories.includes('other'))) {
                const codesArr = specificCodes.size.map(size => {
                    return { SKU: { $regex: new RegExp(`^.{3}${size}.{6}$`) } }
                })
                criteria['$and'].push({ $or: codesArr })
            }

            if (specificCodes.strings && moreCategories?.includes('tied')) {
                const codesArr = specificCodes.strings.map(string => {
                    return { SKU: { $regex: new RegExp(`^.{5}${string}.{2}00$`) } }
                })
                // console.log(codesArr);
                criteria['$and'].push({ $or: codesArr })
            }

            if (specificCodes.tying && moreCategories?.includes('tied')) {
                const codesArr = specificCodes.tying.map(tie => {
                    return { SKU: { $regex: new RegExp(`^.{7}${tie}00$`) } }
                })
                // console.log(codesArr);
                criteria['$and'].push({ $or: codesArr })
            }
        }
        if (!from && !to) {
            criteria = {
                '$or': [
                    { 'Description-Heb': { $regex: txt.trim(), $options: 'i' } },
                    { 'Description-Eng': { $regex: txt.trim(), $options: 'i' } },
                    { SKU: { $regex: txt.trim(), $options: 'i' } }
                ]
            }
        }
        const collection = await dbService.getCollection('inventory')
        let orders = await collection.find(criteria).sort({ [sortBy]: (sortDir === 'down') ? 1 : -1 }).limit(200).toArray()
        return orders
    } catch (err) {
        logger.error('cannot find orders', err)
        throw err
    }
}

async function getByType(type) {
    try {
        const criteria = {}
        if (type === 'strings') {
            criteria['$and'] = [
                { SKU: { $regex: new RegExp('0000$') } },
                { SKU: { $regex: new RegExp('^10000') } }
            ]
        }
        if (type === 'other') {
            criteria.SKU = { $regex: new RegExp('^100.{2}0000.{2}') }
        }
        if (type === 'begged') {
            criteria.SKU = { $regex: new RegExp('000000$') }
        }
        const collection = await dbService.getCollection('inventory')
        let products = await collection.find(criteria).toArray()
        return products
    } catch (err) {
        logger.error('cannot find products', err)
        throw err
    }
}

async function getSizes(type, code) {
    try {
        const criteria = {}
        if (type === 'other') {
            criteria.SKU = { $regex: new RegExp(`^100.{2}0000${code}`) }
        }
        if (type === 'begged') {
            criteria.SKU = { $regex: new RegExp(`^1${code}.{2}000000$`) }
        }
        const collection = await dbService.getCollection('inventory')
        let products = await collection.find(criteria).toArray()
        return products
    } catch (err) {
        logger.error('cannot find products', err)
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
            LastUpdate: new Date,
        }
        const collection = await dbService.getCollection('inventory')
        await collection.updateOne({ _id: ObjectId(product._id) }, { $set: productToSave })
        return productToSave
    } catch (err) {
        logger.error(`cannot update product ${product._id}`, err)
        throw err
    }
}

async function setInventory(product) {
    const { SKU, Inventory, Location } = product
    try {
        const collection = await dbService.getCollection('inventory')
        await collection.updateOne({ SKU }, { $set: { Inventory, LastUpdate: new Date, Location } })
        return product
    } catch (err) {
        logger.error(`cannot update product ${SKU}`, err)
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
            LastUpdate: new Date,
        }
        const collection = await dbService.getCollection('inventory')
        await collection.insertOne(productToAdd)
        return productToAdd
    } catch (err) {
        logger.error('cannot insert product', err)
        throw err
    }
}

async function addNewProduct(Cost, DescriptionEng, DescriptionHeb, Inventory, Price, SKU, USDPrice, Location, MinimumLevel) {
    try {
        const productToAdd = {
            SKU,
            'Description-Heb': DescriptionHeb,
            'Description-Eng': DescriptionEng,
            Inventory: +Inventory,
            Cost: +Cost,
            Price: +Price,
            USDPrice: +USDPrice,
            MinimumLevel: +MinimumLevel,
            Location,
            LastUpdate: new Date,
        }
        const collection = await dbService.getCollection('inventory')
        await collection.insertOne(productToAdd)
        return productToAdd
    } catch (err) {
        logger.error('cannot insert product', err)
        throw err
    }
}

async function newOrderFromIcount(item) {
    try {
        item.data = await getData(item.sku)
        const collection = await dbService.getCollection('orders')
        await collection.insertOne(item)
        return item
    } catch (err) {
        logger.error('cannot insert new order', err)
        throw err
    }
}

async function getData(sku) {
    try {
        const data = {
            beged: { code: -1, name: '' },
            size: { code: -1, name: '' },
            ptil: { code: -1, name: '' },
            tying: { code: -1, name: '' }
        }
        if (sku) {
            const collection = await dbService.getCollection('MongoDataCodes')
            const bName = await collection.findOne({ '$and': [{ Type: 'beged' }, { Code: parseInt(sku.substring(1, 3)) }] })
            const pName = await collection.findOne({ '$and': [{ Type: 'ptil' }, { Code: parseInt(sku.substring(5, 7)) }] })
            const tName = await collection.findOne({ '$and': [{ Type: 'tying' }, { Code: parseInt(sku.substring(7, 9)) }] })

            data.beged.name = bName['item-Heb']
            data.beged.code = parseInt(sku.substring(1, 3))
            data.size.code = parseInt(sku.substring(3, 5))
            data.size.name = parseInt(sku.substring(3, 5))
            data.ptil.name = pName['item-Heb']
            data.ptil.code = parseInt(sku.substring(5, 7))
            data.tying.name = tName['item-Heb']
            data.tying.code = parseInt(sku.substring(7, 9))
        }

        return data
    } catch (err) {
        logger.error('cannot get item data', err)
        throw err
    }
}

export const orderService = {
    query,
    getById,
    getBySKU,
    getByType,
    getSizes,
    updateInventory,
    setInventory,
    add,
    newOrderFromIcount,
    addNewProduct
}