import { logger } from "../../services/logger.service.js";
import { logService } from "./log.service.js";
import { orderService } from "./order.service.js";


export async function getOrders(req, res) {
    const { from, to, maxNum, sortBy, txt, sortDir, categories, moreCategories, specificCodes } = req.query

    try {
        const filterBy = {
            from: new Date(from),
            to: new Date(to),
            maxNum: (maxNum === 'true') ? true : false,
            sortBy: sortBy,
            txt,
            sortDir: sortDir,
            categories: categories,
            moreCategories: moreCategories,
            specificCodes: specificCodes
        }
        // console.log('getting products', filterBy);
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
        // console.log(`Getting ${type}`)
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
            logService.addNewLog({ type: `Added new product`, amount: +amount, description: `Added ${updatedProduct.SKU} - ${updatedProduct['Description-Heb']}`, products: [updatedProduct], SKUs: [updatedProduct.SKU] })
        } else {
            updatedProduct = await orderService.updateInventory(product, +amount)
        }
        await orderService.updateInventory(begged, -amount)
        await orderService.updateInventory(string, -amount)
        logService.addNewLog({ type: 'Added Tied Begged Inventory', amount: +amount, description: `Updated Begged:${begged.SKU} String:${string.SKU}`, products: [begged, string, product], SKUs: [productSKU, stringSKU, beggedSKU] })
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
        logService.addNewLog({ type: `Added Invetory`, amount: +amount, description: `Updated ${updatedProduct.SKU} - ${updatedProduct['Description-Heb']}`, products: [updatedProduct], SKUs: [updatedProduct.SKU] })
        res.json(updatedProduct)
    } catch (err) {
        logger.error('Failed to update inventory', err)
        res.status(500).send({ err: 'Failed to update inventory' })
    }
}

export async function addNewProduct(req, res) {
    try {
        const { Cost, Inventory, Price, SKU, USDPrice, Location, MinimumLevel } = req.body
        const DescriptionEng = req.body['Description-Eng']
        const DescriptionHeb = req.body['Description-Heb']
        const product = await orderService.getBySKU(SKU)
        if (product) {
            await logService.addNewLog({ type: `tried to add new product, SKU taken`, amount: 0, description: `Tried to add ${product.SKU} - ${product['Description-Heb']}`, products: [product], SKUs: [product.SKU] })
            res.json({ msg: 'product SKU already taken', product })
            return
        }
        const newProduct = await orderService.addNewProduct(Cost, DescriptionEng, DescriptionHeb, Inventory, Price, SKU, USDPrice, Location, MinimumLevel)
        logService.addNewLog({ type: `Added new product`, amount: +Inventory, description: `Added ${newProduct.SKU} - ${newProduct['Description-Heb']}`, products: [newProduct], SKUs: [newProduct.SKU] })
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
        const updatedProducts = await products.forEach(async (product) => {
            const res = await orderService.setInventory(product)
            logService.addNewLog({ type: `Updated ${product.SKU}${(products.length > 1) ? ' in bulk update' : ''}`, amount: 1, description: `Updated ${product.SKU} - Inventory: ${product.Inventory}`, products: [product], SKUs: [product.SKU] })
            return res
        })

        if (products.length > 1) {
            const SKUs = products.map(product => product.SKU)
            logService.addNewLog({ type: `Bulk Update`, amount: products.length, description: `Bulk update`, products: [products], SKUs })
        }
        res.json(updatedProducts)
    } catch (err) {
        logger.error('Failed to update inventory', err)
        res.status(500).send({ err: 'Failed to update inventory' })
    }
}
