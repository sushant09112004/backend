import express from 'express'
import { generateEmailTemplate } from '../controller/emailTemplateController.js'
import { saveTemplate, listTemplates } from '../controller/savedEmailController.js'
import { protect } from '../middlewares/auth.js'

const router = express.Router()

router.post('/generate', generateEmailTemplate)
// Save a template for the authenticated user
router.post('/save', protect, saveTemplate)
// List templates for the authenticated user
router.get('/list', protect, listTemplates)

export default router
