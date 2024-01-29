import { logger } from "../../services/logger.service.js";
import { logService } from "../order/log.service.js";
import { dyingService } from "./dying.service.js"

export async function getDyingInfo(req, res) {
    const { User } = req.query

    try {
        const filterBy = {
            User: User || null,
        }
        const dyeOptions = await dyingService.query(filterBy)
        res.json(dyeOptions)
    } catch (err) {
        logger.error('Failed to get dye options', err)
        console.log('Failed to get dye options', err)
        res.status(500).send({ err: 'Failed to get dye options' })
    }
}

export async function addDyingEvent(req, res) {
    const { date, dithionite, dolelot, dye, redye, sets, type, loggedUser } = req.body
    try {
        const eventToAdd = {
            Date: new Date(date),
            User: loggedUser.username,
            dye,
            dithionite,
            type,
            redye,
            dolelot,
            sets
        }
        const newDyingEvent = await dyingService.add(eventToAdd)
        logService.addNewLog({ type: `Added New Dying Event`, amount: +dye, description: `Added ${type}, Dolelot: ${dolelot} ${(redye) ? 're-dye' : `sets: ${sets}`}`, products: [], SKUs: [], userName: loggedUser.username })
        res.json(newDyingEvent)
    } catch (err) {
        logger.error('Failed to add event', err)
        res.status(500).send({ err: 'Failed to add event' })
    }
}