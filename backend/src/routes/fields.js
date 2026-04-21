import express from 'express'
import { auth } from '../middleware/auth.js'
import {
  listFields,
  getField,
  createField,
  deleteField,
  updateStage,
  addObservation,
  listAgents,
} from '../controllers/fields.js'

const router = express.Router()

router.get('/', auth(), listFields)
router.get('/agents', auth(), listAgents)
router.get('/:id', auth(), getField)

router.post('/', auth('admin'), createField)
router.delete('/:id', auth('admin'), deleteField)

router.patch('/:id/stage', auth(), updateStage)
router.post('/:id/observations', auth(), addObservation)

export default router