import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'community.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    address TEXT DEFAULT '',
    role INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT DEFAULT '',
    deposit REAL DEFAULT 0,
    images TEXT DEFAULT '[]',
    status INTEGER DEFAULT 0,
    borrow_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS borrows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL REFERENCES tools(id),
    borrower_id INTEGER NOT NULL REFERENCES users(id),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status INTEGER DEFAULT 0,
    deposit_amount REAL DEFAULT 0,
    deposit_status INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    returned_at TEXT
  );

  CREATE TABLE IF NOT EXISTS damage_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrow_id INTEGER NOT NULL REFERENCES borrows(id),
    reporter_id INTEGER NOT NULL REFERENCES users(id),
    description TEXT NOT NULL,
    images TEXT DEFAULT '[]',
    compensation REAL DEFAULT 0,
    status INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS help_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    urgency INTEGER DEFAULT 1,
    status INTEGER DEFAULT 0,
    respondent_id INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_top INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'system',
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    admin_id INTEGER NOT NULL REFERENCES users(id),
    status INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT DEFAULT '',
    location TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    max_participants INTEGER DEFAULT 50,
    points_reward INTEGER DEFAULT 20,
    status INTEGER DEFAULT 1,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    status INTEGER DEFAULT 0,
    points_awarded INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT DEFAULT '',
    points_cost INTEGER NOT NULL,
    stock INTEGER DEFAULT 100,
    category TEXT DEFAULT 'physical',
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS point_redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    item_id INTEGER NOT NULL REFERENCES shop_items(id),
    item_name TEXT NOT NULL,
    points_cost INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    status INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS point_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    type TEXT DEFAULT 'earn',
    related_id INTEGER,
    related_type TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`)

const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
if (categoryCount.count === 0) {
  db.exec(`
    INSERT INTO categories (name, icon) VALUES
      ('电动工具', 'zap'),
      ('家用工具', 'home'),
      ('户外装备', 'tent'),
      ('园林工具', 'flower-2'),
      ('维修工具', 'wrench'),
      ('其他', 'package');
  `)
}

const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 1").get() as { count: number }
if (adminCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10)
  db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)').run(
    '13800000000',
    hashedPassword,
    '管理员',
    1
  )
}

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count < 5) {
  const mockUsers = [
    { phone: '13800000001', password: '123456', name: '张大爷', address: '1号楼2单元', role: 0, points: 120 },
    { phone: '13800000002', password: '123456', name: '李阿姨', address: '2号楼1单元', role: 0, points: 85 },
    { phone: '13800000003', password: '123456', name: '王小明', address: '3号楼3单元', role: 0, points: 210 },
    { phone: '13800000004', password: '123456', name: '赵叔叔', address: '5号楼1单元', role: 0, points: 65 },
  ]
  const insertUser = db.prepare('INSERT INTO users (phone, password, name, address, role, points) VALUES (?, ?, ?, ?, ?, ?)')
  mockUsers.forEach(user => {
    insertUser.run(user.phone, bcrypt.hashSync(user.password, 10), user.name, user.address, user.role, user.points)
  })
}

const toolCount = db.prepare('SELECT COUNT(*) as count FROM tools').get() as { count: number }
if (toolCount.count === 0) {
  const mockTools = [
    { user_id: 2, name: '博世电钻', category_id: 1, description: '家用电动螺丝刀，配有多种批头，适合家具安装、墙面打孔等。最大功率800W，附带收纳箱。', deposit: 50, images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electric%20drill%20power%20tool%20yellow%20black&image_size=square_hd"]', status: 1, borrow_count: 15 },
    { user_id: 3, name: '铝合金梯子 4米', category_id: 2, description: '伸缩式铝合金梯子，最高可达4米，承重150kg。适合换灯泡、打扫卫生、挂窗帘等家用场景。', deposit: 80, images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=aluminum%20ladder%204%20meter%20silver&image_size=square_hd"]', status: 1, borrow_count: 8 },
    { user_id: 4, name: '露营帐篷 4人', category_id: 3, description: '全自动双层帐篷，防雨防晒，可容纳4人。配有地钉、风绳、收纳袋。适合周末家庭露营。', deposit: 100, images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=camping%20tent%204%20person%20green%20outdoor&image_size=square_hd"]', status: 1, borrow_count: 23 },
    { user_id: 5, name: '园林剪枝剪', category_id: 4, description: '专业级园艺剪刀，SK5钢刀片，省力弹簧设计。适合修剪树枝、花卉整理等。', deposit: 30, images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gardening%20pruning%20shears%20green%20handle&image_size=square_hd"]', status: 1, borrow_count: 12 },
    { user_id: 2, name: '活动扳手套装', category_id: 5, description: '8寸+10寸+12寸活动扳手三件套，铬钒钢材质，防滑手柄。适合水管维修、家具组装。', deposit: 40, images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=adjustable%20wrench%20set%20tool&image_size=square_hd"]', status: 1, borrow_count: 19 },
    { user_id: 3, name: '折叠露营车', category_id: 3, description: '大容量折叠手拉车，承重100kg，可折叠收纳。适合采购、露营搬运、取快递。', deposit: 60, images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=folding%20camping%20wagon%20cart%20blue&image_size=square_hd"]', status: 1, borrow_count: 27 },
    { user_id: 4, name: '电动螺丝刀套装', category_id: 1, description: '充电式电动螺丝刀，配32件批头套装，USB充电。小巧轻便，适合日常组装。', deposit: 35, images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electric%20screwdriver%20cordless%20set&image_size=square_hd"]', status: 1, borrow_count: 31 },
    { user_id: 5, name: '高压洗车水枪', category_id: 6, description: '家用高压洗车水枪，可调节水压，配多种喷头。也可用于浇花、冲洗地面。', deposit: 25, images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=high%20pressure%20car%20wash%20gun%20blue&image_size=square_hd"]', status: 1, borrow_count: 14 },
  ]
  const insertTool = db.prepare('INSERT INTO tools (user_id, name, category_id, description, deposit, images, status, borrow_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  mockTools.forEach(tool => {
    insertTool.run(tool.user_id, tool.name, tool.category_id, tool.description, tool.deposit, tool.images, tool.status, tool.borrow_count)
  })
}

const noticeCount = db.prepare('SELECT COUNT(*) as count FROM notices').get() as { count: number }
if (noticeCount.count === 0) {
  const mockNotices = [
    { author_id: 1, title: '温馨邻里平台正式上线啦！', content: '亲爱的邻居们：\n\n经过精心筹备，温馨邻里社区工具共享平台今天正式上线了！在这里，您可以：\n\n📦 发布闲置工具，让资源流动起来\n🤝 借用邻居工具，省钱又省心\n❤️ 发布互助求助，邻里互帮互助\n🏆 参与社区贡献，赢取积分奖励\n\n让我们一起构建温暖、互助、共享的美好社区！\n\n— 温馨邻里运营团队', is_top: 1 },
    { author_id: 1, title: '春节期间借用时间延长通知', content: '春节期间（2月9日-2月17日），所有工具借用时间自动延长至假期结束，如有特殊需求请联系管理员。祝大家新春快乐！', is_top: 0 },
    { author_id: 1, title: '3号楼工具共享角开放', content: '3号楼地下一层的社区工具共享角已开放，欢迎大家将闲置工具捐赠到共享角，供所有邻居免费使用。', is_top: 0 },
    { author_id: 1, title: '社区互助之星评选开始', content: '本月社区互助之星评选活动正式开始，积分排名前3的邻居将获得精美礼品一份！大家快来参与吧。', is_top: 0 },
  ]
  const insertNotice = db.prepare('INSERT INTO notices (author_id, title, content, is_top) VALUES (?, ?, ?, ?)')
  mockNotices.forEach(notice => {
    insertNotice.run(notice.author_id, notice.title, notice.content, notice.is_top)
  })
}

const helpCount = db.prepare('SELECT COUNT(*) as count FROM help_requests').get() as { count: number }
if (helpCount.count === 0) {
  const mockHelp = [
    { user_id: 2, title: '求助：需要电钻安装衣柜', description: '刚网购了一个大衣柜，需要电钻帮忙打孔安装，愿意支付10元感谢费，或者用我家梯子交换借用。周六周日在家。', urgency: 2, status: 0 },
    { user_id: 3, title: '求助：帮我把大米扛上楼', description: '买了两袋50斤的大米，本人年纪大了扛不动，哪位好心的邻居帮忙扛到5楼，万分感谢！', urgency: 3, status: 1, respondent_id: 4 },
    { user_id: 4, title: '求助：借一下梯子换灯泡', description: '客厅的吸顶灯坏了，需要4米左右的梯子换一下灯泡，大概借用半小时即可，万分感谢！', urgency: 1, status: 2, respondent_id: 5 },
    { user_id: 5, title: '求助：帮忙照顾一下宠物', description: '下周要出差3天，家里有一只小猫咪需要喂食换水，有邻居可以帮忙照顾一下吗？可以支付报酬。', urgency: 2, status: 0 },
  ]
  const insertHelp = db.prepare('INSERT INTO help_requests (user_id, title, description, urgency, status, respondent_id) VALUES (?, ?, ?, ?, ?, ?)')
  mockHelp.forEach(help => {
    insertHelp.run(help.user_id, help.title, help.description, help.urgency, help.status, help.respondent_id)
  })
}

const activityCount = db.prepare('SELECT COUNT(*) as count FROM activities').get() as { count: number }
if (activityCount.count === 0) {
  const mockActivities = [
    { title: '周末工具义修日', description: '免费为邻居们提供小家电、自行车、家具等维修服务。带上您需要修理的物品，我们有专业的志愿者团队为您服务！活动现场还提供免费茶水和小点心。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20tool%20repair%20event%20neighbors%20helping&image_size=landscape_16_9', location: '社区活动中心 1楼大厅', start_time: '2026-06-28 09:00:00', end_time: '2026-06-28 17:00:00', max_participants: 80, points_reward: 30, status: 1, creator_id: 1 },
    { title: '邻里聚餐 BBQ 派对', description: '夏日邻里聚餐活动！我们提供烧烤架和基础食材，欢迎大家自带拿手菜来分享。现场有儿童游乐区和音乐表演，让我们一起度过愉快的周末夜晚！', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=neighborhood%20bbq%20party%20summer%20community&image_size=landscape_16_9', location: '社区中央花园', start_time: '2026-07-05 18:00:00', end_time: '2026-07-05 22:00:00', max_participants: 100, points_reward: 20, status: 1, creator_id: 1 },
    { title: '社区环保垃圾分类宣传', description: '学习垃圾分类知识，让我们的社区更美好！活动包含垃圾分类知识讲座、互动游戏、手工DIY等环节，参与家庭可获赠分类垃圾桶。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=environmental%20recycling%20community%20event%20green&image_size=landscape_16_9', location: '3号楼前小广场', start_time: '2026-07-12 09:30:00', end_time: '2026-07-12 11:30:00', max_participants: 50, points_reward: 15, status: 1, creator_id: 1 },
    { title: '儿童暑期安全教育讲座', description: '专为5-12岁儿童设计的暑期安全教育，涵盖防溺水、防拐骗、消防安全、交通安全等内容。由社区民警和消防员主讲，互动性强，欢迎家长陪同参加。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20safety%20education%20classroom%20community&image_size=landscape_16_9', location: '社区活动室 2楼', start_time: '2026-07-19 14:00:00', end_time: '2026-07-19 16:00:00', max_participants: 60, points_reward: 25, status: 1, creator_id: 1 },
    { title: '爱心旧物捐赠活动', description: '把闲置的衣物、书籍、玩具捐赠给有需要的人。所有物品将经过消毒整理后捐赠给山区儿童和困难家庭。捐赠者可获得积分奖励和爱心证书。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=charity%20donation%20drive%20clothes%20books%20community&image_size=landscape_16_9', location: '社区服务中心门口', start_time: '2026-07-26 10:00:00', end_time: '2026-07-26 16:00:00', max_participants: 200, points_reward: 20, status: 1, creator_id: 1 },
    { title: '中老年智能手机培训', description: '帮助社区长辈学习使用智能手机，包括微信聊天、视频通话、手机支付、健康码使用等实用技能。一对一教学，耐心细致。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20learning%20smartphone%20community%20training&image_size=landscape_16_9', location: '社区电教室', start_time: '2026-08-02 09:00:00', end_time: '2026-08-02 11:00:00', max_participants: 30, points_reward: 35, status: 1, creator_id: 1 },
  ]
  const insertActivity = db.prepare('INSERT INTO activities (title, description, image, location, start_time, end_time, max_participants, points_reward, status, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  mockActivities.forEach(a => {
    insertActivity.run(a.title, a.description, a.image, a.location, a.start_time, a.end_time, a.max_participants, a.points_reward, a.status, a.creator_id)
  })
}

const shopItemCount = db.prepare('SELECT COUNT(*) as count FROM shop_items').get() as { count: number }
if (shopItemCount.count === 0) {
  const mockItems = [
    { name: '免费工具借用券（3天）', description: '凭此券可免费借用任意工具3天，无需支付押金。限本人使用，有效期30天。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tool%20borrow%20coupon%20voucher%20orange%20ticket&image_size=square_hd', points_cost: 50, stock: 200, category: 'service', status: 1 },
    { name: '社区定制帆布袋', description: '温馨邻里社区定制环保帆布袋，印有社区Logo，结实耐用，容量大。适合购物、买菜、通勤。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=custom%20canvas%20tote%20bag%20eco%20friendly%20beige&image_size=square_hd', points_cost: 80, stock: 100, category: 'physical', status: 1 },
    { name: '精美马克杯', description: '社区定制陶瓷马克杯，温暖橙色系设计，350ml容量，微波炉和洗碗机适用。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ceramic%20coffee%20mug%20warm%20orange%20color&image_size=square_hd', points_cost: 60, stock: 150, category: 'physical', status: 1 },
    { name: '社区互助之星徽章', description: '金属珐琅徽章，社区荣誉象征。仅限积分达到500分以上的居民兑换。佩戴徽章可参加社区VIP活动。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gold%20star%20badge%20honor%20medal%20community&image_size=square_hd', points_cost: 500, stock: 50, category: 'physical', status: 1 },
    { name: '家政清洁服务（2小时）', description: '专业家政服务人员上门提供2小时家庭清洁服务，包括客厅、卧室、厨房、卫生间清洁。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=house%20cleaning%20service%20professional%20cleaner&image_size=square_hd', points_cost: 300, stock: 50, category: 'service', status: 1 },
    { name: '免费打印券（50张）', description: '社区服务中心免费打印券，可打印黑白文档50张，A4纸。有效期6个月。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=printer%20paper%20document%20printing%20voucher&image_size=square_hd', points_cost: 30, stock: 300, category: 'service', status: 1 },
    { name: '儿童益智绘本套装', description: '精选5本儿童绘本，适合3-8岁儿童阅读，内容涵盖情商培养、科普知识、经典童话。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20colorful%20picture%20books%20set%20educational&image_size=square_hd', points_cost: 150, stock: 80, category: 'physical', status: 1 },
    { name: '绿植小盆栽', description: '多肉植物或绿萝小盆栽，含精美陶瓷花盆，净化空气，美化家居。', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=small%20potted%20succulent%20plant%20cute%20pot&image_size=square_hd', points_cost: 45, stock: 120, category: 'physical', status: 1 },
  ]
  const insertItem = db.prepare('INSERT INTO shop_items (name, description, image, points_cost, stock, category, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
  mockItems.forEach(item => {
    insertItem.run(item.name, item.description, item.image, item.points_cost, item.stock, item.category, item.status)
  })
}

const participantCount = db.prepare('SELECT COUNT(*) as count FROM activity_participants').get() as { count: number }
if (participantCount.count === 0) {
  const mockParticipants = [
    { activity_id: 1, user_id: 2, status: 1, points_awarded: 0 },
    { activity_id: 1, user_id: 3, status: 0, points_awarded: 0 },
    { activity_id: 2, user_id: 4, status: 0, points_awarded: 0 },
    { activity_id: 2, user_id: 5, status: 0, points_awarded: 0 },
    { activity_id: 3, user_id: 2, status: 0, points_awarded: 0 },
  ]
  const insertParticipant = db.prepare('INSERT INTO activity_participants (activity_id, user_id, status, points_awarded) VALUES (?, ?, ?, ?)')
  mockParticipants.forEach(p => {
    insertParticipant.run(p.activity_id, p.user_id, p.status, p.points_awarded)
  })
}

export function createNotification(userId: number, title: string, content: string, type: string = 'system') {
  db.prepare('INSERT INTO notifications (user_id, title, content, type) VALUES (?, ?, ?, ?)').run(userId, title, content, type)
}

export function addPoints(userId: number, points: number, reason: string, relatedId?: number, relatedType?: string) {
  const stmt = db.prepare('UPDATE users SET points = points + ? WHERE id = ?')
  stmt.run(points, userId)
  db.prepare('INSERT INTO point_records (user_id, change, reason, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)').run(
    userId, points, reason, 'earn', relatedId || null, relatedType || null
  )
}

export function deductPoints(userId: number, points: number, reason: string, relatedId?: number, relatedType?: string) {
  const stmt = db.prepare('UPDATE users SET points = points - ? WHERE id = ?')
  stmt.run(points, userId)
  db.prepare('INSERT INTO point_records (user_id, change, reason, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)').run(
    userId, -points, reason, 'spend', relatedId || null, relatedType || null
  )
}

export { db }
