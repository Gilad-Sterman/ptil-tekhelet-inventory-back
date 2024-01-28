import express from 'express'
import { getOrders, getOrderById, updateInventory, updateInventoryBySKU, addNewProduct, getproductsByType, updateBulkInventory, getproductSizes, icountInfo } from './order.controller.js'

export const orderRoutes = express.Router()

orderRoutes.get('/', getOrders)
// orderRoutes.get('/:id', getOrderById)
orderRoutes.get('/size', getproductSizes)
orderRoutes.get('/:type', getproductsByType)
orderRoutes.put('/', updateInventory)
orderRoutes.put('/bulk', updateBulkInventory)
orderRoutes.put('/:SKU', updateInventoryBySKU)
orderRoutes.post('/new', addNewProduct)
orderRoutes.post('/icount', icountInfo)

