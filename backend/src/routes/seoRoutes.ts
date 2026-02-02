import express from 'express'
import routes from '../config/seoRoutes.config'
import * as seoController from '../controllers/seoController'
import authJwt from '../middlewares/authJwt'

const seoRoutes = express.Router()

seoRoutes.route(routes.generate).post(authJwt.verifyToken, seoController.generateSeo)

export default seoRoutes
