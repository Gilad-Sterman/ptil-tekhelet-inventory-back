import { logger } from "../../services/logger.service.js";
import { logService } from "../order/log.service.js";
import { shziraService } from "./shzira.service.js";

export async function getShziraInfo(req, res) {
    const { User } = req.query

    try {
        const filterBy = {
            User: User || null,
        }
        const shziraOptions = await shziraService.query(filterBy)
        res.json(shziraOptions)
    } catch (err) {
        logger.error('Failed to get shzira options', err)
        res.status(500).send({ err: 'Failed to get shzira options' })
    }
}

export async function addShziraEvent(req, res) {
    const { date, maslulim, sets, type, loggedUser } = req.body
    try {
        const eventToAdd = {
            Date: new Date(date),
            User: loggedUser.username,
            type,
            shezira_runs: maslulim,
            sets
        }
        const newShziraEvent = await shziraService.add(eventToAdd)
        logService.addNewLog({ type: `Added New Shzira Event`, amount: sets, description: `Added ${type}, Shezira-runs: ${maslulim}`, products: [], SKUs: [], userName: loggedUser.username })
        res.json(newShziraEvent)
    } catch (err) {
        logger.error('Failed to add event', err)
        res.status(500).send({ err: 'Failed to add event' })
    }
}