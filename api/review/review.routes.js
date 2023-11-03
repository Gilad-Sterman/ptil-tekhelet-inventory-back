import express from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'

import { addReview, getReviews, deleteReview } from './review.controller.js'
const router = express.Router()

router.get('/', getReviews)
router.post('/', requireAuth, addReview)
// router.post('/', addReview)
router.delete('/:id', requireAuth, deleteReview)
// router.delete('/:id', deleteReview)

export const reviewRoutes = router