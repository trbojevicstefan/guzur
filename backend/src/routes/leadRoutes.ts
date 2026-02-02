import express from 'express'
import routeNames from '../config/leadRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as leadController from '../controllers/leadController'

const routes = express.Router()

routes.route(routeNames.create).post(leadController.create)
routes.route(routeNames.update).put(authJwt.verifyToken, leadController.update)
routes.route(routeNames.delete).delete(authJwt.verifyToken, leadController.deleteLeads)
routes.route(routeNames.getLead).get(authJwt.verifyToken, leadController.getLead)
routes.route(routeNames.getLeads).post(authJwt.verifyToken, leadController.getLeads)

export default routes
