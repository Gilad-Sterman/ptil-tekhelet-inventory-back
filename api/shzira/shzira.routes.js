import express from 'express'
import { addShziraEvent, getShziraInfo } from './shzira.controller.js'

export const shziraRoutes = express.Router()

shziraRoutes.get('/', getShziraInfo)
shziraRoutes.post('/', addShziraEvent)