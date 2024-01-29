import http from 'http'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv';

// dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import { logger } from './services/logger.service.js'
logger.info('server.js loaded...')

const app = express()
const server = http.createServer(app)

app.use(cookieParser())
app.use(express.json())
app.use(express.static('public'))

if (process.env.NODE_ENV === 'production') {
    // Express serve static files on production environment
    app.use(express.static(path.resolve(__dirname, 'public')))
    console.log('__dirname: ', __dirname)
} else {
    // Configuring CORS
    const corsOptions = {
        // Make sure origin contains the url your frontend is running on
        origin: ['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5174', 'http://localhost:5174', 'http://127.0.0.1:3000', 'http://localhost:3000'],
        credentials: true
    }
    app.use(cors(corsOptions))
}



import { setupSocketAPI } from './services/socket.service.js'

import { orderRoutes } from './api/order/order.routes.js'
import { dyingRoutes } from './api/dying/dying.routes.js'
import { shziraRoutes } from './api/shzira/shzira.routes.js'

import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'
app.all('*', setupAsyncLocalStorage)

app.use('/api/order', orderRoutes)
app.use('/api/dying', dyingRoutes)
app.use('/api/shzira', shziraRoutes)
setupSocketAPI(server)


app.get('/**', (req, res) => {
    console.log('hi');
    res.sendFile(path.resolve('public/index.html'))
})


const port = process.env.PORT || 3030
server.listen(port, () => {
    console.log(`Server listening on port http://127.0.0.1:${port}/`)
})