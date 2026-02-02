import express from 'express'
import routeNames from '../config/organizationRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as organizationController from '../controllers/organizationController'

const routes = express.Router()

routes.route(routeNames.create).post(authJwt.verifyToken, organizationController.createOrganization)
routes.route(routeNames.update).put(authJwt.verifyToken, organizationController.updateOrganization)
routes.route(routeNames.delete).delete(authJwt.verifyToken, organizationController.deleteOrganization)
routes.route(routeNames.getOrganization).get(authJwt.verifyToken, organizationController.getOrganization)
routes.route(routeNames.getOrganizations).get(authJwt.verifyToken, organizationController.getOrganizations)
routes.route(routeNames.getOrgMembers).get(authJwt.verifyToken, organizationController.getOrgMembers)
routes.route(routeNames.inviteOrgMember).post(authJwt.verifyToken, organizationController.inviteOrgMember)

routes.route(routeNames.getFrontendOrganizations).get(organizationController.getFrontendOrganizations)
routes.route(routeNames.getFrontendOrganization).get(organizationController.getFrontendOrganization)
routes.route(routeNames.getFrontendOrganizationBySlug).get(organizationController.getFrontendOrganizationBySlug)
routes.route(routeNames.getFrontendOrgMembers).get(organizationController.getFrontendOrgMembers)

export default routes
