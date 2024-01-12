import { logger } from "../../services/logger.service.js";
import { orderService } from "./order.service.js";


export async function getOrders(req, res) {
    try {
        // const tags = (req.query.tags) ? req.query.tags.split(',') : 'all'
        // const likedByUsers = req.query.likedByUsers.split(',')
        const filterBy = {
            from: new Date(req.query.from).getTime(),
            to: new Date(req.query.to).getTime(),
            maxNum: (req.query.maxNum) ? +req.query.maxNum : req.query.maxNum,
            sortBy: req.query.sortBy,
            categories: req.query.categories,
            moreCategories: req.query.moreCategories
        }
        logger.debug('Getting orders', filterBy)
        console.log('Getting orders', filterBy)
        const orders = await orderService.query(filterBy)
        res.json(orders)
    } catch (err) {
        logger.error('Failed to get orders', err)
        console.log('Failed to get orders', err)
        res.status(500).send({ err: 'Failed to get orders' })
    }
}

export async function getOrderById(req, res) {
    try {
        const orderId = req.params.id
        const order = await orderService.getById(orderId)
        res.json(order)
    } catch (err) {
        logger.error('Failed to get order', err)
        res.status(500).send({ err: 'Failed to get order' })
    }
}

export async function updateInventory(req, res) {
    try {
        const { productSKU, stringSKU, beggedSKU, amount } = req.body
        const string = await orderService.getBySKU(stringSKU)
        const begged = await orderService.getBySKU(beggedSKU)
        const product = await orderService.getBySKU(productSKU)
        let updatedProduct
        if (!product) {
            updatedProduct = await orderService.add(productSKU, +amount)
        } else {
            updatedProduct = await orderService.updateInventory(product, +amount)
        }
        await orderService.updateInventory(begged, -amount)
        await orderService.updateInventory(string, -amount)
        res.json(updatedProduct)
    } catch (err) {
        logger.error('Failed to update inventory', err)
        res.status(500).send({ err: 'Failed to update inventory' })
    }
}

export async function updateInventoryBySKU(req, res) {
    try {
        const productSKU = req.params.SKU
        const { amount } = req.body
        const product = await orderService.getBySKU(productSKU)
        const updatedProduct = await orderService.updateInventory(product, +amount)
        res.json(updatedProduct)
    } catch (err) {
        logger.error('Failed to update inventory', err)
        res.status(500).send({ err: 'Failed to update inventory' })
    }
}

