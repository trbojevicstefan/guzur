import express from 'express'
import routeNames from '../config/rfqRoutes.config'
import * as rfqController from '../controllers/rfqController'
import authJwt from '../middlewares/authJwt'

const routes = express.Router()

routes.route(routeNames.createRfq).post(rfqController.createRfq)
routes.route(routeNames.getRfqs).get(authJwt.verifyToken, rfqController.getRfqs)
routes.route(routeNames.updateRfq).put(authJwt.verifyToken, rfqController.updateRfq)

export default routes
