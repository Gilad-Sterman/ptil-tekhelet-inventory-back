import express from 'express'
import { getStations, getStationById, addStation, updateStation, removeStation } from './station.controller.js'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'

export const stationRoutes = express.Router()

stationRoutes.get('/', getStations)
stationRoutes.get('/:id', getStationById)
stationRoutes.post('/', requireAuth, addStation)
// stationRoutes.post('/', addStation)
stationRoutes.put('/', requireAuth, updateStation)
// stationRoutes.delete('/:id', requireAuth, removeStation)
stationRoutes.delete('/:id', removeStation)
