import { Router, type Request, type Response } from 'express'
import { db, createNotification } from '../database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware, adminMiddleware)

router.get('/users', (req: Request, res: Response): void => {
  try {
    const users = db.prepare('SELECT id, phone, name, avatar, address, role, points, status, created_at FROM users ORDER BY created_at DESC').all() as any[]
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户列表失败' })
  }
})

router.put('/users/:id', (req: Request, res: Response): void => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    const { status } = req.body
    if (status === undefined) {
      res.status(400).json({ success: false, error: '状态值为必填项' })
      return
    }
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id)
    const updated = db.prepare('SELECT id, phone, name, avatar, address, role, points, status, created_at FROM users WHERE id = ?').get(req.params.id) as any
    createNotification(user.id, '账号状态变更', `您的账号状态已${status === 1 ? '启用' : '禁用'}`, 'system')
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新用户状态失败' })
  }
})

router.get('/tools/pending', (req: Request, res: Response): void => {
  try {
    const tools = db.prepare(`SELECT t.*, u.name as user_name, c.name as category_name
      FROM tools t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.status = 0
      ORDER BY t.created_at ASC`).all() as any[]
    tools.forEach(t => { try { t.images = JSON.parse(t.images) } catch { t.images = [] } })
    res.json({ success: true, data: tools })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取待审核工具失败' })
  }
})

router.put('/tools/:id/audit', (req: Request, res: Response): void => {
  try {
    const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as any
    if (!tool) {
      res.status(404).json({ success: false, error: '工具不存在' })
      return
    }
    const { approved, reason } = req.body
    if (approved) {
      db.prepare('UPDATE tools SET status = 1 WHERE id = ?').run(req.params.id)
      createNotification(tool.user_id, '工具审核通过', `您发布的工具「${tool.name}」已通过审核`, 'system')
    } else {
      db.prepare('UPDATE tools SET status = 3 WHERE id = ?').run(req.params.id)
      createNotification(tool.user_id, '工具审核未通过', `您发布的工具「${tool.name}」未通过审核${reason ? '，原因：' + reason : ''}`, 'system')
    }
    const updated = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as any
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '审核工具失败' })
  }
})

router.post('/violations', (req: Request, res: Response): void => {
  try {
    const { target_id, target_type, reason } = req.body
    if (!target_id || !target_type || !reason) {
      res.status(400).json({ success: false, error: '目标ID、类型和原因为必填项' })
      return
    }
    const result = db.prepare('INSERT INTO violations (target_id, target_type, reason, admin_id) VALUES (?, ?, ?, ?)').run(
      target_id, target_type, reason, req.user!.id
    )
    const violation = db.prepare('SELECT * FROM violations WHERE id = ?').get(result.lastInsertRowid) as any
    res.json({ success: true, data: violation })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建违规记录失败' })
  }
})

router.get('/stats', (req: Request, res: Response): void => {
  try {
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
    const totalTools = (db.prepare('SELECT COUNT(*) as count FROM tools').get() as any).count
    const totalBorrows = (db.prepare('SELECT COUNT(*) as count FROM borrows').get() as any).count
    const activeBorrows = (db.prepare("SELECT COUNT(*) as count FROM borrows WHERE status = 1").get() as any).count
    const monthlyTrend = db.prepare(`SELECT strftime('%Y-%m', created_at) as month,
      COUNT(*) as count
      FROM borrows
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC`).all() as any[]

    const toolPublishTrend = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM tools
      WHERE created_at >= date('now', '-29 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all() as any[]

    const borrowTrend = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM borrows
      WHERE created_at >= date('now', '-29 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all() as any[]

    const categoryBorrowStats = db.prepare(`
      SELECT c.id, c.name, COUNT(b.id) as count
      FROM categories c
      LEFT JOIN tools t ON t.category_id = c.id
      LEFT JOIN borrows b ON b.tool_id = t.id
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `).all() as any[]

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTools,
        totalBorrows,
        activeBorrows,
        monthlyTrend,
        toolPublishTrend,
        borrowTrend,
        categoryBorrowStats
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取统计数据失败' })
  }
})

router.get('/rankings', (req: Request, res: Response): void => {
  try {
    const rankings = db.prepare('SELECT id, name, avatar, points FROM users WHERE status = 1 ORDER BY points DESC LIMIT 20').all() as any[]
    res.json({ success: true, data: rankings })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取排行榜失败' })
  }
})

export default router
