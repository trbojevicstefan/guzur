import express from 'express'
import routeNames from '../config/messageRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as messageController from '../controllers/messageController'

const routes = express.Router()

routes.route(routeNames.createMessage).post(authJwt.verifyToken, messageController.createMessage)
routes.route(routeNames.createThread).post(authJwt.verifyToken, messageController.createThread)
routes.route(routeNames.broadcastMessage).post(authJwt.verifyToken, messageController.broadcastMessage)
routes.route(routeNames.getMessages).get(authJwt.verifyToken, messageController.getMessages)
routes.route(routeNames.getMessagesThread).get(authJwt.verifyToken, messageController.getMessages)
routes.route(routeNames.getThreads).get(authJwt.verifyToken, messageController.getThreads)

export default routes
