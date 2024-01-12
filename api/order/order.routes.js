import express from 'express'
import { getOrders, getOrderById, updateInventory, updateInventoryBySKU } from './order.controller.js'

export const orderRoutes = express.Router()

orderRoutes.get('/', getOrders)
orderRoutes.get('/:id', getOrderById)
orderRoutes.put('/', updateInventory)
orderRoutes.put('/:SKU', updateInventoryBySKU)

