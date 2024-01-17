import { logger } from "../../services/logger.service.js";
import { orderService } from "./order.service.js";


export async function getOrders(req, res) {
    const { from, to, maxNum, sortBy, txt, sortDir, categories, moreCategories, specificCodes } = req.query
    try {
        const filterBy = {
            from: new Date(from),
            to: new Date(to),
            maxNum: (maxNum) ? +maxNum : maxNum,
            sortBy: sortBy,
            txt: txt,
            sortDir: sortDir,
            categories: categories,
            moreCategories: moreCategories,
            specificCodes: specificCodes
        }
        logger.debug('Getting orders', filterBy)
        // console.log('Getting orders', filterBy)
        const orders = await orderService.query(filterBy)
        res.json(orders)
    } catch (err) {
        logger.error('Failed to get orders', err)
        console.log('Failed to get orders', err)
        res.status(500).send({ err: 'Failed to get orders' })
    }
}

export async function getproductsByType(req, res) {
    try {
        const type = req.params.type
        logger.debug(`Getting ${type}`)
        console.log(`Getting ${type}`)
        const products = await orderService.getByType(type)
        res.json(products)
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

export async function addNewProduct(req, res) {
    try {
        const { Cost, DescriptionEng, DescriptionHeb, Inventory, Price, SKU, USDPrice } = req.body
        const product = await orderService.getBySKU(SKU)
        // console.log('product:', product);
        if (product) {
            res.json({ msg: 'product SKU already taken', product })
            return
        }
        const newProduct = await orderService.addNewProduct(Cost, DescriptionEng, DescriptionHeb, Inventory, Price, SKU, USDPrice)
        res.json(newProduct)
    } catch (err) {
        logger.error('Failed to create product', err)
        res.status(500).send({ err: 'Failed to create product' })
    }
}

export async function updateBulkInventory(req, res) {
    try {
        const { products } = req.body
        // console.log(products);
        const updatedProducts = await products.forEach(product => {
            return orderService.setInventory(product)
        })
        res.json(updatedProducts)
    } catch (err) {
        logger.error('Failed to update inventory', err)
        res.status(500).send({ err: 'Failed to update inventory' })
    }
}
