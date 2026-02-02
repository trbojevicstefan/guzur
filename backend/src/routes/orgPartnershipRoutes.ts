import express from 'express'
import routeNames from '../config/orgPartnershipRoutes.config'
import * as orgPartnershipController from '../controllers/orgPartnershipController'
import authJwt from '../middlewares/authJwt'

const routes = express.Router()

routes.route(routeNames.requestPartnership).post(authJwt.verifyToken, orgPartnershipController.requestPartnership)
routes.route(routeNames.updatePartnership).put(authJwt.verifyToken, orgPartnershipController.updatePartnership)
routes.route(routeNames.getOrgPartnerships).get(authJwt.verifyToken, orgPartnershipController.getOrgPartnerships)

export default routes
