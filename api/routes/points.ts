import { Router, type Request, type Response } from 'express'
import { db } from '../database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/records', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { type } = req.query
    let sql = `SELECT pr.* FROM point_records pr WHERE pr.user_id = ?`
    const params: any[] = [req.user!.id]
    if (type) { sql += ' AND pr.type = ?'; params.push(type) }
    sql += ' ORDER BY pr.created_at DESC LIMIT 100'
    const records = db.prepare(sql).all(...params) as any[]
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取积分记录失败' })
  }
})

router.get('/summary', authMiddleware, (req: Request, res: Response): void => {
  try {
    const totalEarned = db.prepare("SELECT COALESCE(SUM(change), 0) as total FROM point_records WHERE user_id = ? AND type = 'earn'").get(req.user!.id) as { total: number }
    const totalSpent = db.prepare("SELECT COALESCE(SUM(ABS(change)), 0) as total FROM point_records WHERE user_id = ? AND type = 'spend'").get(req.user!.id) as { total: number }
    const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user!.id) as any
    res.json({
      success: true,
      data: {
        current: user?.points || 0,
        total_earned: totalEarned.total || 0,
        total_spent: totalSpent.total || 0
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取积分汇总失败' })
  }
})

router.get('/all-records', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const records = db.prepare(`SELECT pr.*, u.name as user_name
      FROM point_records pr
      LEFT JOIN users u ON pr.user_id = u.id
      ORDER BY pr.created_at DESC LIMIT 200`).all() as any[]
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取积分记录失败' })
  }
})

export default router
