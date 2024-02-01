import { logger } from "../../services/logger.service.js";
import { logService } from "./log.service.js";
import { orderService } from "./order.service.js";


export async function getOrders(req, res) {
    const { from, to, maxNum, sortBy, txt, sortDir, categories, moreCategories, specificCodes } = req.query

    try {
        const filterBy = {
            from: from ? new Date(from) : null,
            to: to ? new Date(to) : null,
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

export async function getproductSizes(req, res) {
    try {
        const type = req.query.type
        const code = req.query.code
        logger.debug(`Getting sizes for ${type, code}`)
        const products = await orderService.getSizes(type, code)
        res.json(products)
    } catch (err) {
        logger.error('Failed to get sizes', err)
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
        const { productSKU, stringSKU, beggedSKU, amount, loggedUser } = req.body
        const string = await orderService.getBySKU(stringSKU)
        const begged = await orderService.getBySKU(beggedSKU)
        const product = await orderService.getBySKU(productSKU)
        let updatedProduct
        if (!product) {
            updatedProduct = await orderService.add(productSKU, +amount)
            logService.addNewLog({ type: `Added new product`, amount: +amount, description: `Added ${updatedProduct.SKU} - ${updatedProduct['Description-Heb']}`, products: [updatedProduct], SKUs: [updatedProduct.SKU], userName: loggedUser.username })
        } else {
            updatedProduct = await orderService.updateInventory(product, +amount)
        }
        await orderService.updateInventory(begged, -amount)
        await orderService.updateInventory(string, -amount)
        logService.addNewLog({ type: 'Added Tied Begged Inventory', amount: +amount, description: `Updated Begged:${begged.SKU} String:${string.SKU}`, products: [begged, string, product], SKUs: [productSKU, stringSKU, beggedSKU], userName: loggedUser.username })
        res.json(updatedProduct)
    } catch (err) {
        logger.error('Failed to update inventory', err)
        res.status(500).send({ err: 'Failed to update inventory' })
    }
}

export async function updateInventoryBySKU(req, res) {
    try {
        const productSKU = req.params.SKU
        const { amount, loggedUser } = req.body
        const product = await orderService.getBySKU(productSKU)
        const updatedProduct = await orderService.updateInventory(product, +amount)
        logService.addNewLog({ type: `Added Inventory`, amount: +amount, description: `Updated ${updatedProduct.SKU} - ${updatedProduct['Description-Heb']}`, products: [updatedProduct], SKUs: [updatedProduct.SKU], userName: loggedUser.username })
        res.json(updatedProduct)
    } catch (err) {
        logger.error('Failed to update inventory', err)
        res.status(500).send({ err: 'Failed to update inventory' })
    }
}

export async function addNewProduct(req, res) {
    try {
        const { Cost, Inventory, Price, SKU, USDPrice, Location, MinimumLevel, loggedUser } = req.body
        const DescriptionEng = req.body['Description-Eng']
        const DescriptionHeb = req.body['Description-Heb']
        const product = await orderService.getBySKU(SKU)
        if (product) {
            await logService.addNewLog({ type: `tried to add new product, SKU taken`, amount: 0, description: `Tried to add ${product.SKU} - ${product['Description-Heb']}`, products: [product], SKUs: [product.SKU], userName: loggedUser.username })
            res.json({ msg: 'product SKU already taken', product })
            return
        }
        const newProduct = await orderService.addNewProduct(Cost, DescriptionEng, DescriptionHeb, Inventory, Price, SKU, USDPrice, Location, MinimumLevel)
        logService.addNewLog({ type: `Added new product`, amount: +Inventory, description: `Added ${newProduct.SKU} - ${newProduct['Description-Heb']}`, products: [newProduct], SKUs: [newProduct.SKU], userName: loggedUser.username })
        res.json(newProduct)
    } catch (err) {
        logger.error('Failed to create product', err)
        res.status(500).send({ err: 'Failed to create product' })
    }
}

export async function updateBulkInventory(req, res) {
    try {
        const { products, loggedUser } = req.body
        const updatedProducts = []
        for (const product of products) {
            const updatedProduct = await orderService.setInventory(product)
            logService.addNewLog({ type: `Updated ${product.SKU}${(products.length > 1) ? ' in bulk update' : ''}`, amount: 1, description: `Updated ${product.SKU} - Inventory: ${product.Inventory} - Location: ${product.Location}`, products: [product], SKUs: [product.SKU], userName: loggedUser.username })
            updatedProducts.push(updatedProduct)
        }
        if (products.length > 1) {
            const SKUs = products.map(product => product.SKU)
            logService.addNewLog({ type: `Bulk Update`, amount: products.length, description: `Bulk update`, products: [products], SKUs, userName: loggedUser.username })
        }
        res.json(updatedProducts)
    } catch (err) {
        logger.error('Failed to update inventory', err)
        res.status(500).send({ err: 'Failed to update inventory' })
    }
}

// export async function icountInfo(req, res) {
//     try {
//         const { items } = req.body
//         const myItems = items.map(item => {
//             return {
//                 doctype: item.doctype,
//                 inventory_item_makat: item.inventory_item_makat,
//                 description: item.description,
//                 quantity: +item.quantity,
//                 sku: item.sku + '',
//             }
//         })
//         const products = []
//         for (const item of myItems) {
//             if (item.doctype === 'invrec' || item.doctype === 'invoice') {
//                 const product = await orderService.getBySKU(item.sku)
//                 if (product) {
//                     const updatedProduct = await orderService.updateInventory(product, -item.quantity)
//                     products.push(updatedProduct)
//                 }
//             }
//         }
//         res.json(products)
//     } catch (err) {
//         logger.error('Failed to update inventory from Icount', err)
//         res.status(500).send({ err: 'Failed to update inventory from Icount' })
//     }
// }
