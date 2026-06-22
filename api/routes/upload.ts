import { Router, type Request, type Response } from 'express'
import { uploadMiddleware } from '../middleware/upload.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  uploadMiddleware.single('image')(req, res, (err) => {
    if (err) {
      res.status(400).json({ success: false, error: err.message })
      return
    }
    if (!req.file) {
      res.status(400).json({ success: false, error: '请选择要上传的图片' })
      return
    }
    const url = `/uploads/${req.file.filename}`
    res.json({ success: true, data: { url } })
  })
})

export default router
