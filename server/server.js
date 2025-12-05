// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// 1. 中介軟體設定
app.use(cors()); // 允許前端跨網域存取
app.use(express.json()); // 解析 JSON
// 重要：將 uploads 資料夾設為公開，讓前端可以用 URL 讀取圖片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. 資料庫連線
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 1. 設定 Cloudinary (填入你的資料)
cloudinary.config({
  cloud_name: 'dyw3omoot',
  api_key: '712259893879145',
  api_secret: '1_dSwARnjmS7VQH3msj5dRRkpGg'
});

// 2. 設定 Multer 儲存引擎改成 Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'touhou-grid', // 在圖床上的資料夾名稱
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// --- API Routes ---

// 取得九宮格所有資料
app.get('/api/grid', async (req, res) => {
  try {
    // 拿主題
    const settings = await pool.query('SELECT * FROM grid_settings WHERE id = 1');
    // 拿格子資料
    const slots = await pool.query('SELECT * FROM grid_slots');
    
    // 整理成前端好用的格式 (陣列 0-8)
    const gridArray = Array(9).fill(null);
    slots.rows.forEach(row => {
      gridArray[row.slot_index] = row;
    });

    res.json({
      title: settings.rows[0],
      grid: gridArray
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 上傳圖片 API
app.post('/api/upload', upload.single('image'), async (req, res) => {
  const { artist_name } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    // 省略：找空位的邏輯跟原本一樣 ...
    const usedSlots = await pool.query('SELECT slot_index FROM grid_slots');
    const occupied = usedSlots.rows.map(row => row.slot_index);
    let nextSlot = -1;
    for (let i = 0; i < 9; i++) {
      if (!occupied.includes(i)) { nextSlot = i; break; }
    }
    if (nextSlot === -1) return res.status(400).json({ error: 'Grid is full!' });

    // *** 關鍵改變：這裡直接拿 Cloudinary 的網址 ***
    const imagePath = req.file.path; 

    await pool.query(
      'INSERT INTO grid_slots (slot_index, artist_name, image_path) VALUES ($1, $2, $3)',
      [nextSlot, artist_name, imagePath]
    );

    res.json({ success: true, slot: nextSlot, imagePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});