import express from 'express'
import { addDyingEvent, getDyingInfo } from './dying.controller.js'

export const dyingRoutes = express.Router()

dyingRoutes.get('/', getDyingInfo)
dyingRoutes.post('/', addDyingEvent)