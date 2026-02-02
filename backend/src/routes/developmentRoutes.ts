import express from 'express'
import routeNames from '../config/developmentRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as developmentController from '../controllers/developmentController'

const routes = express.Router()

routes.route(routeNames.create).post(authJwt.verifyToken, developmentController.create)
routes.route(routeNames.update).put(authJwt.verifyToken, developmentController.update)
routes.route(routeNames.delete).delete(authJwt.verifyToken, developmentController.deleteDevelopment)
routes.route(routeNames.getDevelopment).get(authJwt.verifyToken, developmentController.getDevelopment)
routes.route(routeNames.getDevelopments).get(authJwt.verifyToken, developmentController.getDevelopments)
routes.route(routeNames.getFrontendDevelopments).get(developmentController.getFrontendDevelopments)
routes.route(routeNames.getFrontendDevelopment).get(developmentController.getFrontendDevelopment)

export default routes
