require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

const app = express();
// 使用 Render 提供的 PORT，如果沒有則用 5000
const PORT = process.env.PORT || 5000;

// 1. 設定 Cloudinary
cloudinary.config({
  cloud_name: 'dyw3omoot',
  api_key: '712259893879145',
  api_secret: '1_dSwARnjmS7VQH3msj5dRRkpGg'
});

// 2. 設定 Multer 儲存引擎 (存到 Cloudinary)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'touhou-grid', // 圖床上的資料夾名稱
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});
const upload = multer({ storage: storage });

// 3. 資料庫連線設定 (關鍵修復：SSL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // ★ 這一行非常重要，Neon 資料庫必備！
  }
});

app.use(cors());
app.use(express.json());

// --- API Routes ---

// 取得九宮格資料
app.get('/api/grid', async (req, res) => {
  try {
    const settings = await pool.query('SELECT * FROM grid_settings WHERE id = 1');
    const slots = await pool.query('SELECT * FROM grid_slots ORDER BY slot_index ASC');
    
    // 初始化 7 格 (0-6)
    let gridData = Array(7).fill(null);
    slots.rows.forEach(row => {
      // 防止舊資料 (index >= 7) 造成錯誤
      if (row.slot_index < 7) {
        gridData[row.slot_index] = row;
      }
    });

    // 如果資料庫沒標題，給個預設值
    const titleData = settings.rows.length > 0 ? settings.rows[0] : { main_theme: '未命名', sub_title: 'DC群繪畫' };

    res.json({
      title: titleData,
      grid: gridData
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 上傳圖片 API
app.post('/api/upload', upload.single('image'), async (req, res) => {
  const { artist_name } = req.body;
  
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    // 1. 找出目前已佔用的格子
    const usedSlots = await pool.query('SELECT slot_index FROM grid_slots');
    // 轉成數字陣列，避免字串比對錯誤
    const occupied = usedSlots.rows.map(r => parseInt(r.slot_index));
    
    let nextSlot = -1;
    // ★ 限制只找 0 到 6 (共7格)
    for (let i = 0; i < 7; i++) {
      if (!occupied.includes(i)) {
        nextSlot = i;
        break;
      }
    }

    if (nextSlot === -1) {
      return res.status(400).json({ error: '九宮格已滿！' });
    }

    // 2. 寫入資料庫
    const imagePath = req.file.path; // Cloudinary 的網址

    await pool.query(
      'INSERT INTO grid_slots (slot_index, artist_name, image_path) VALUES ($1, $2, $3)',
      [nextSlot, artist_name, imagePath]
    );

    res.json({ success: true, slot: nextSlot, imagePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// 重置 API (加上密碼保護)
app.get('/api/reset', async (req, res) => {
    if (req.query.pwd !== 'admin123') {
      return res.status(403).send('密碼錯誤');
    }
    try {
      await pool.query('DELETE FROM grid_slots');
      res.send('已重置所有格子');
    } catch (err) {
      res.status(500).send(err.message);
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
