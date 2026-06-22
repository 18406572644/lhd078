import { Router, type Request, type Response } from 'express'
import { db, createNotification } from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { tool_id, start_date, end_date } = req.body
    if (!tool_id || !start_date || !end_date) {
      res.status(400).json({ success: false, error: '工具ID、开始日期和结束日期为必填项' })
      return
    }
    const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(tool_id) as any
    if (!tool) {
      res.status(404).json({ success: false, error: '工具不存在' })
      return
    }
    if (tool.status !== 1) {
      res.status(400).json({ success: false, error: '该工具当前不可借用' })
      return
    }
    if (tool.user_id === req.user!.id) {
      res.status(400).json({ success: false, error: '不能借用自己的工具' })
      return
    }
    const result = db.prepare('INSERT INTO borrows (tool_id, borrower_id, start_date, end_date, deposit_amount) VALUES (?, ?, ?, ?, ?)').run(
      tool_id, req.user!.id, start_date, end_date, tool.deposit
    )
    const borrow = db.prepare('SELECT * FROM borrows WHERE id = ?').get(result.lastInsertRowid) as any
    createNotification(tool.user_id, '收到借用申请', `有人申请借用您的工具「${tool.name}」`, 'borrow')
    res.json({ success: true, data: borrow })
  } catch (error) {
    res.status(500).json({ success: false, error: '提交借用申请失败' })
  }
})

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { status } = req.query
    let sql = `SELECT b.*, t.name as tool_name, t.images as tool_images, t.deposit as tool_deposit,
      u.name as borrower_name, o.name as owner_name
      FROM borrows b
      LEFT JOIN tools t ON b.tool_id = t.id
      LEFT JOIN users u ON b.borrower_id = u.id
      LEFT JOIN users o ON t.user_id = o.id
      WHERE b.borrower_id = ? OR t.user_id = ?`
    const params: any[] = [req.user!.id, req.user!.id]
    if (status !== undefined) { sql += ' AND b.status = ?'; params.push(status) }
    sql += ' ORDER BY b.created_at DESC'
    const borrows = db.prepare(sql).all(...params) as any[]
    borrows.forEach(b => { try { b.tool_images = JSON.parse(b.tool_images) } catch { b.tool_images = [] } })
    res.json({ success: true, data: borrows })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取借用列表失败' })
  }
})

router.put('/:id/approve', authMiddleware, (req: Request, res: Response): void => {
  try {
    const borrow = db.prepare('SELECT b.*, t.user_id as owner_id, t.name as tool_name FROM borrows b LEFT JOIN tools t ON b.tool_id = t.id WHERE b.id = ?').get(req.params.id) as any
    if (!borrow) {
      res.status(404).json({ success: false, error: '借用记录不存在' })
      return
    }
    if (borrow.owner_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '只有工具主人可以审批' })
      return
    }
    if (borrow.status !== 0) {
      res.status(400).json({ success: false, error: '该借用申请不在待审批状态' })
      return
    }
    const { approved } = req.body
    if (approved) {
      db.prepare('UPDATE borrows SET status = 1, deposit_status = 0 WHERE id = ?').run(req.params.id)
      db.prepare('UPDATE tools SET status = 2 WHERE id = ?').run(borrow.tool_id)
      createNotification(borrow.borrower_id, '借用申请已通过', `您申请借用「${borrow.tool_name}」已通过，请支付押金`, 'borrow')
    } else {
      db.prepare('UPDATE borrows SET status = 3 WHERE id = ?').run(req.params.id)
      createNotification(borrow.borrower_id, '借用申请被拒绝', `您申请借用「${borrow.tool_name}」被拒绝`, 'borrow')
    }
    const updated = db.prepare('SELECT * FROM borrows WHERE id = ?').get(req.params.id) as any
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '审批借用申请失败' })
  }
})

router.put('/:id/return', authMiddleware, (req: Request, res: Response): void => {
  try {
    const borrow = db.prepare('SELECT b.*, t.user_id as owner_id, t.name as tool_name, t.id as tool_id FROM borrows b LEFT JOIN tools t ON b.tool_id = t.id WHERE b.id = ?').get(req.params.id) as any
    if (!borrow) {
      res.status(404).json({ success: false, error: '借用记录不存在' })
      return
    }
    if (borrow.borrower_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '只有借用人可以归还' })
      return
    }
    if (borrow.status !== 1) {
      res.status(400).json({ success: false, error: '该借用不在进行中状态' })
      return
    }
    db.prepare("UPDATE borrows SET status = 2, deposit_status = 2, returned_at = datetime('now') WHERE id = ?").run(req.params.id)
    db.prepare('UPDATE tools SET status = 1, borrow_count = borrow_count + 1 WHERE id = ?').run(borrow.tool_id)
    db.prepare('UPDATE users SET points = points + 5 WHERE id = ?').run(borrow.borrower_id)
    db.prepare('UPDATE users SET points = points + 3 WHERE id = ?').run(borrow.owner_id)
    createNotification(borrow.owner_id, '工具已归还', `借用的工具「${borrow.tool_name}」已归还`, 'borrow')
    const updated = db.prepare('SELECT * FROM borrows WHERE id = ?').get(req.params.id) as any
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '归还登记失败' })
  }
})

router.post('/:id/damage', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { description, images } = req.body
    if (!description) {
      res.status(400).json({ success: false, error: '损坏描述为必填项' })
      return
    }
    const borrow = db.prepare('SELECT b.*, t.user_id as owner_id, t.name as tool_name FROM borrows b LEFT JOIN tools t ON b.tool_id = t.id WHERE b.id = ?').get(req.params.id) as any
    if (!borrow) {
      res.status(404).json({ success: false, error: '借用记录不存在' })
      return
    }
    db.prepare('INSERT INTO damage_claims (borrow_id, reporter_id, description, images) VALUES (?, ?, ?, ?)').run(
      borrow.id, req.user!.id, description, JSON.stringify(images || [])
    )
    db.prepare('UPDATE borrows SET status = 4 WHERE id = ?').run(req.params.id)
    createNotification(borrow.owner_id, '工具损坏报告', `借用工具「${borrow.tool_name}」被报告损坏`, 'borrow')
    res.json({ success: true, message: '损坏报告已提交' })
  } catch (error) {
    res.status(500).json({ success: false, error: '提交损坏报告失败' })
  }
})

export default router
