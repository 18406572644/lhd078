import { Router, type Request, type Response } from 'express'
import { db, createNotification } from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/pay', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { borrow_id, amount } = req.body
    if (!borrow_id || amount === undefined) {
      res.status(400).json({ success: false, error: '借用ID和金额为必填项' })
      return
    }
    const borrow = db.prepare('SELECT b.*, t.name as tool_name FROM borrows b LEFT JOIN tools t ON b.tool_id = t.id WHERE b.id = ?').get(borrow_id) as any
    if (!borrow) {
      res.status(404).json({ success: false, error: '借用记录不存在' })
      return
    }
    if (borrow.borrower_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '只有借用人可以支付押金' })
      return
    }
    if (borrow.deposit_status !== 0) {
      res.status(400).json({ success: false, error: '押金状态不正确' })
      return
    }
    db.prepare('UPDATE borrows SET deposit_status = 1 WHERE id = ?').run(borrow_id)
    createNotification(req.user!.id, '押金已支付', `您已支付工具「${borrow.tool_name}」的押金 ¥${amount}`, 'deposit')
    const updated = db.prepare('SELECT * FROM borrows WHERE id = ?').get(borrow_id) as any
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '支付押金失败' })
  }
})

router.post('/refund', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { borrow_id } = req.body
    if (!borrow_id) {
      res.status(400).json({ success: false, error: '借用ID为必填项' })
      return
    }
    const borrow = db.prepare('SELECT b.*, t.name as tool_name, t.user_id as owner_id FROM borrows b LEFT JOIN tools t ON b.tool_id = t.id WHERE b.id = ?').get(borrow_id) as any
    if (!borrow) {
      res.status(404).json({ success: false, error: '借用记录不存在' })
      return
    }
    if (borrow.borrower_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '只有借用人可以申请退还押金' })
      return
    }
    if (borrow.deposit_status !== 1) {
      res.status(400).json({ success: false, error: '押金状态不正确' })
      return
    }
    db.prepare('UPDATE borrows SET deposit_status = 2 WHERE id = ?').run(borrow_id)
    createNotification(borrow.owner_id, '押金退还申请', `借用人申请退还工具「${borrow.tool_name}」的押金`, 'deposit')
    const updated = db.prepare('SELECT * FROM borrows WHERE id = ?').get(borrow_id) as any
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '申请退还押金失败' })
  }
})

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const deposits = db.prepare(`SELECT b.id as borrow_id, b.deposit_amount, b.deposit_status, b.created_at,
      t.name as tool_name, b.borrower_id
      FROM borrows b
      LEFT JOIN tools t ON b.tool_id = t.id
      WHERE b.borrower_id = ?
      AND b.deposit_amount > 0
      ORDER BY b.created_at DESC`).all(req.user!.id) as any[]
    res.json({ success: true, data: deposits })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取押金记录失败' })
  }
})

export default router
