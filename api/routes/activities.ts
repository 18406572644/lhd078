import { Router, type Request, type Response } from 'express'
import { db, createNotification, addPoints } from '../database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { status, keyword } = req.query
    let sql = `SELECT a.*, u.name as creator_name,
      (SELECT COUNT(*) FROM activity_participants ap WHERE ap.activity_id = a.id AND ap.status IN (0, 1)) as participant_count
      FROM activities a
      LEFT JOIN users u ON a.creator_id = u.id
      WHERE 1=1`
    const params: any[] = []
    if (status !== undefined) { sql += ' AND a.status = ?'; params.push(status) }
    if (keyword) { sql += ' AND (a.title LIKE ? OR a.description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
    sql += ' ORDER BY a.created_at DESC'
    const activities = db.prepare(sql).all(...params) as any[]
    res.json({ success: true, data: activities })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取活动列表失败' })
  }
})

router.get('/my', authMiddleware, (req: Request, res: Response): void => {
  try {
    const activities = db.prepare(`SELECT a.*, ap.status as join_status, ap.points_awarded,
      (SELECT COUNT(*) FROM activity_participants ap2 WHERE ap2.activity_id = a.id AND ap2.status IN (0, 1)) as participant_count
      FROM activity_participants ap
      LEFT JOIN activities a ON ap.activity_id = a.id
      WHERE ap.user_id = ?
      ORDER BY ap.created_at DESC`).all(req.user!.id) as any[]
    res.json({ success: true, data: activities })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取我的活动失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const activity = db.prepare(`SELECT a.*, u.name as creator_name,
      (SELECT COUNT(*) FROM activity_participants ap WHERE ap.activity_id = a.id AND ap.status IN (0, 1)) as participant_count
      FROM activities a
      LEFT JOIN users u ON a.creator_id = u.id
      WHERE a.id = ?`).get(req.params.id) as any
    if (!activity) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }
    const participants = db.prepare(`SELECT ap.*, u.name as user_name, u.avatar as user_avatar
      FROM activity_participants ap
      LEFT JOIN users u ON ap.user_id = u.id
      WHERE ap.activity_id = ? AND ap.status IN (0, 1)
      ORDER BY ap.created_at DESC`).all(req.params.id) as any[]
    activity.participants = participants
    res.json({ success: true, data: activity })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取活动详情失败' })
  }
})

router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { title, description, image, location, start_time, end_time, max_participants, points_reward } = req.body
    if (!title || !description || !location || !start_time || !end_time) {
      res.status(400).json({ success: false, error: '请填写完整的活动信息' })
      return
    }
    const result = db.prepare(`INSERT INTO activities
      (title, description, image, location, start_time, end_time, max_participants, points_reward, creator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      title, description, image || '', location, start_time, end_time,
      max_participants || 50, points_reward || 20, req.user!.id
    )
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid) as any
    res.json({ success: true, data: activity })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建活动失败' })
  }
})

router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id) as any
    if (!activity) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }
    const { title, description, image, location, start_time, end_time, max_participants, points_reward, status } = req.body
    const updates: string[] = []
    const values: any[] = []
    if (title !== undefined) { updates.push('title = ?'); values.push(title) }
    if (description !== undefined) { updates.push('description = ?'); values.push(description) }
    if (image !== undefined) { updates.push('image = ?'); values.push(image) }
    if (location !== undefined) { updates.push('location = ?'); values.push(location) }
    if (start_time !== undefined) { updates.push('start_time = ?'); values.push(start_time) }
    if (end_time !== undefined) { updates.push('end_time = ?'); values.push(end_time) }
    if (max_participants !== undefined) { updates.push('max_participants = ?'); values.push(max_participants) }
    if (points_reward !== undefined) { updates.push('points_reward = ?'); values.push(points_reward) }
    if (status !== undefined) { updates.push('status = ?'); values.push(status) }
    if (updates.length === 0) {
      res.status(400).json({ success: false, error: '没有需要更新的字段' })
      return
    }
    values.push(req.params.id)
    db.prepare(`UPDATE activities SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    const updated = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id) as any
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新活动失败' })
  }
})

router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id) as any
    if (!activity) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }
    db.prepare('DELETE FROM activity_participants WHERE activity_id = ?').run(req.params.id)
    db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除活动失败' })
  }
})

router.post('/:id/join', authMiddleware, (req: Request, res: Response): void => {
  try {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id) as any
    if (!activity) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }
    if (activity.status !== 1) {
      res.status(400).json({ success: false, error: '活动未开放报名' })
      return
    }
    const existing = db.prepare('SELECT * FROM activity_participants WHERE activity_id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any
    if (existing) {
      res.status(400).json({ success: false, error: '您已报名此活动' })
      return
    }
    const count = db.prepare('SELECT COUNT(*) as cnt FROM activity_participants WHERE activity_id = ? AND status IN (0, 1)').get(req.params.id) as { cnt: number }
    if (count.cnt >= activity.max_participants) {
      res.status(400).json({ success: false, error: '活动名额已满' })
      return
    }
    db.prepare('INSERT INTO activity_participants (activity_id, user_id, status) VALUES (?, ?, 0)').run(req.params.id, req.user!.id)
    createNotification(req.user!.id, '活动报名成功', `您已成功报名"${activity.title}"活动，请准时参加！`, 'activity')
    res.json({ success: true, message: '报名成功' })
  } catch (error) {
    res.status(500).json({ success: false, error: '报名失败' })
  }
})

router.post('/:id/cancel', authMiddleware, (req: Request, res: Response): void => {
  try {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id) as any
    if (!activity) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }
    const existing = db.prepare('SELECT * FROM activity_participants WHERE activity_id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any
    if (!existing) {
      res.status(400).json({ success: false, error: '您未报名此活动' })
      return
    }
    if (existing.status === 1 && existing.points_awarded > 0) {
      res.status(400).json({ success: false, error: '活动已完成，无法取消' })
      return
    }
    db.prepare('DELETE FROM activity_participants WHERE activity_id = ? AND user_id = ?').run(req.params.id, req.user!.id)
    res.json({ success: true, message: '取消报名成功' })
  } catch (error) {
    res.status(500).json({ success: false, error: '取消报名失败' })
  }
})

router.post('/:id/award-points', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id) as any
    if (!activity) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }
    const { user_id } = req.body
    const participant = db.prepare('SELECT * FROM activity_participants WHERE activity_id = ? AND user_id = ?').get(req.params.id, user_id) as any
    if (!participant) {
      res.status(400).json({ success: false, error: '该用户未报名此活动' })
      return
    }
    if (participant.points_awarded > 0) {
      res.status(400).json({ success: false, error: '该用户已发放积分' })
      return
    }
    const points = activity.points_reward
    addPoints(user_id, points, `参与活动"${activity.title}"获得奖励`, activity.id, 'activity')
    db.prepare('UPDATE activity_participants SET status = 1, points_awarded = ? WHERE activity_id = ? AND user_id = ?').run(points, req.params.id, user_id)
    createNotification(user_id, '积分奖励', `您参与"${activity.title}"活动，获得${points}积分奖励！`, 'points')
    res.json({ success: true, message: `已发放${points}积分` })
  } catch (error) {
    res.status(500).json({ success: false, error: '发放积分失败' })
  }
})

export default router
