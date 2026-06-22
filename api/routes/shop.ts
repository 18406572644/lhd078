import { Router, type Request, type Response } from 'express'
import { db, createNotification, deductPoints } from '../database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/items', (req: Request, res: Response): void => {
  try {
    const { category, keyword } = req.query
    let sql = `SELECT * FROM shop_items WHERE status = 1`
    const params: any[] = []
    if (category) { sql += ' AND category = ?'; params.push(category) }
    if (keyword) { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
    sql += ' ORDER BY created_at DESC'
    const items = db.prepare(sql).all(...params) as any[]
    res.json({ success: true, data: items })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取商品列表失败' })
  }
})

router.get('/items/:id', (req: Request, res: Response): void => {
  try {
    const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(req.params.id) as any
    if (!item) {
      res.status(404).json({ success: false, error: '商品不存在' })
      return
    }
    res.json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取商品详情失败' })
  }
})

router.post('/items', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { name, description, image, points_cost, stock, category, status } = req.body
    if (!name || !description || points_cost === undefined) {
      res.status(400).json({ success: false, error: '请填写完整的商品信息' })
      return
    }
    const result = db.prepare(`INSERT INTO shop_items
      (name, description, image, points_cost, stock, category, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      name, description, image || '', points_cost, stock || 100, category || 'physical', status ?? 1
    )
    const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(result.lastInsertRowid) as any
    res.json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建商品失败' })
  }
})

router.put('/items/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(req.params.id) as any
    if (!item) {
      res.status(404).json({ success: false, error: '商品不存在' })
      return
    }
    const { name, description, image, points_cost, stock, category, status } = req.body
    const updates: string[] = []
    const values: any[] = []
    if (name !== undefined) { updates.push('name = ?'); values.push(name) }
    if (description !== undefined) { updates.push('description = ?'); values.push(description) }
    if (image !== undefined) { updates.push('image = ?'); values.push(image) }
    if (points_cost !== undefined) { updates.push('points_cost = ?'); values.push(points_cost) }
    if (stock !== undefined) { updates.push('stock = ?'); values.push(stock) }
    if (category !== undefined) { updates.push('category = ?'); values.push(category) }
    if (status !== undefined) { updates.push('status = ?'); values.push(status) }
    if (updates.length === 0) {
      res.status(400).json({ success: false, error: '没有需要更新的字段' })
      return
    }
    values.push(req.params.id)
    db.prepare(`UPDATE shop_items SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    const updated = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(req.params.id) as any
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新商品失败' })
  }
})

router.delete('/items/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(req.params.id) as any
    if (!item) {
      res.status(404).json({ success: false, error: '商品不存在' })
      return
    }
    db.prepare('DELETE FROM shop_items WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除商品失败' })
  }
})

router.get('/my-redemptions', authMiddleware, (req: Request, res: Response): void => {
  try {
    const redemptions = db.prepare('SELECT * FROM point_redemptions WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id) as any[]
    res.json({ success: true, data: redemptions })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取兑换记录失败' })
  }
})

router.post('/redeem/:itemId', authMiddleware, (req: Request, res: Response): void => {
  try {
    const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(req.params.itemId) as any
    if (!item) {
      res.status(404).json({ success: false, error: '商品不存在' })
      return
    }
    if (item.status !== 1) {
      res.status(400).json({ success: false, error: '商品已下架' })
      return
    }
    if (item.stock <= 0) {
      res.status(400).json({ success: false, error: '商品库存不足' })
      return
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any
    if (!user || user.points < item.points_cost) {
      res.status(400).json({ success: false, error: '积分不足' })
      return
    }
    const quantity = Number(req.body.quantity) || 1
    const totalCost = item.points_cost * quantity
    if (user.points < totalCost) {
      res.status(400).json({ success: false, error: '积分不足' })
      return
    }
    if (item.stock < quantity) {
      res.status(400).json({ success: false, error: '库存不足' })
      return
    }

    const tx = db.transaction(() => {
      deductPoints(req.user!.id, totalCost, `兑换商品"${item.name}"`, item.id, 'shop_item')
      db.prepare('UPDATE shop_items SET stock = stock - ? WHERE id = ?').run(quantity, req.params.itemId)
      const result = db.prepare(`INSERT INTO point_redemptions
        (user_id, item_id, item_name, points_cost, quantity, status)
        VALUES (?, ?, ?, ?, ?, 0)`).run(
        req.user!.id, item.id, item.name, item.points_cost, quantity
      )
      createNotification(req.user!.id, '兑换成功', `您已成功兑换"${item.name}"，消耗${totalCost}积分。请前往社区服务中心领取。`, 'points')
      return result.lastInsertRowid
    })

    const redemptionId = tx()
    res.json({ success: true, data: { id: redemptionId }, message: '兑换成功' })
  } catch (error) {
    res.status(500).json({ success: false, error: '兑换失败' })
  }
})

router.put('/redemptions/:id/status', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const redemption = db.prepare('SELECT * FROM point_redemptions WHERE id = ?').get(req.params.id) as any
    if (!redemption) {
      res.status(404).json({ success: false, error: '兑换记录不存在' })
      return
    }
    const { status } = req.body
    if (status === undefined) {
      res.status(400).json({ success: false, error: '状态值为必填项' })
      return
    }
    db.prepare('UPDATE point_redemptions SET status = ? WHERE id = ?').run(status, req.params.id)
    if (status === 1) {
      createNotification(redemption.user_id, '兑换已领取', `您兑换的"${redemption.item_name}"已成功领取，感谢您对社区的贡献！`, 'points')
    }
    const updated = db.prepare('SELECT * FROM point_redemptions WHERE id = ?').get(req.params.id) as any
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新状态失败' })
  }
})

router.get('/redemptions', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const redemptions = db.prepare(`SELECT pr.*, u.name as user_name, u.phone as user_phone
      FROM point_redemptions pr
      LEFT JOIN users u ON pr.user_id = u.id
      ORDER BY pr.created_at DESC`).all() as any[]
    res.json({ success: true, data: redemptions })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取兑换列表失败' })
  }
})

export default router
