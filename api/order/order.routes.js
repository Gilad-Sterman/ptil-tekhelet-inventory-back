import express from 'express'
import { getOrders, getOrderById, updateInventory, updateInventoryBySKU, addNewProduct, getproductsByType } from './order.controller.js'

export const orderRoutes = express.Router()

orderRoutes.get('/', getOrders)
// orderRoutes.get('/:id', getOrderById)
orderRoutes.get('/:type', getproductsByType)
orderRoutes.put('/', updateInventory)
orderRoutes.put('/:SKU', updateInventoryBySKU)
orderRoutes.post('/new', addNewProduct)

