import { Router, type Request, type Response } from 'express'
import { db, createNotification } from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status, urgency } = req.query
    let sql = `SELECT h.*, u.name as user_name, u.avatar as user_avatar,
      r.name as respondent_name
      FROM help_requests h
      LEFT JOIN users u ON h.user_id = u.id
      LEFT JOIN users r ON h.respondent_id = r.id
      WHERE 1=1`
    const params: any[] = []
    if (status !== undefined) { sql += ' AND h.status = ?'; params.push(status) }
    if (urgency !== undefined) { sql += ' AND h.urgency = ?'; params.push(urgency) }
    sql += ' ORDER BY h.created_at DESC'
    const requests = db.prepare(sql).all(...params) as any[]
    res.json({ success: true, data: requests })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取求助列表失败' })
  }
})

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { title, description, urgency } = req.body
    if (!title || !description) {
      res.status(400).json({ success: false, error: '标题和描述为必填项' })
      return
    }
    const result = db.prepare('INSERT INTO help_requests (user_id, title, description, urgency) VALUES (?, ?, ?, ?)').run(
      req.user!.id, title, description, urgency || 1
    )
    const helpRequest = db.prepare('SELECT * FROM help_requests WHERE id = ?').get(result.lastInsertRowid) as any
    res.json({ success: true, data: helpRequest })
  } catch (error) {
    res.status(500).json({ success: false, error: '发布求助失败' })
  }
})

router.post('/:id/respond', authMiddleware, (req: Request, res: Response): void => {
  try {
    const helpRequest = db.prepare('SELECT * FROM help_requests WHERE id = ?').get(req.params.id) as any
    if (!helpRequest) {
      res.status(404).json({ success: false, error: '求助不存在' })
      return
    }
    if (helpRequest.status !== 0) {
      res.status(400).json({ success: false, error: '该求助不在待帮助状态' })
      return
    }
    if (helpRequest.user_id === req.user!.id) {
      res.status(400).json({ success: false, error: '不能响应自己的求助' })
      return
    }
    db.prepare('UPDATE help_requests SET respondent_id = ?, status = 1 WHERE id = ?').run(req.user!.id, req.params.id)
    createNotification(helpRequest.user_id, '有人响应了您的求助', `您的求助「${helpRequest.title}」已被响应`, 'system')
    const updated = db.prepare('SELECT * FROM help_requests WHERE id = ?').get(req.params.id) as any
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '响应求助失败' })
  }
})

router.put('/:id/complete', authMiddleware, (req: Request, res: Response): void => {
  try {
    const helpRequest = db.prepare('SELECT * FROM help_requests WHERE id = ?').get(req.params.id) as any
    if (!helpRequest) {
      res.status(404).json({ success: false, error: '求助不存在' })
      return
    }
    if (helpRequest.status !== 1) {
      res.status(400).json({ success: false, error: '该求助不在进行中状态' })
      return
    }
    db.prepare('UPDATE help_requests SET status = 2 WHERE id = ?').run(req.params.id)
    db.prepare('UPDATE users SET points = points + 5 WHERE id = ?').run(helpRequest.user_id)
    if (helpRequest.respondent_id) {
      db.prepare('UPDATE users SET points = points + 10 WHERE id = ?').run(helpRequest.respondent_id)
    }
    createNotification(helpRequest.user_id, '求助已完成', `您的求助「${helpRequest.title}」已标记为完成`, 'system')
    if (helpRequest.respondent_id) {
      createNotification(helpRequest.respondent_id, '互助完成', `您响应的求助「${helpRequest.title}」已完成，获得10积分`, 'system')
    }
    const updated = db.prepare('SELECT * FROM help_requests WHERE id = ?').get(req.params.id) as any
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '完成互助失败' })
  }
})

export default router
