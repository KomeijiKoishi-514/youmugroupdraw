import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import './App.css';

function App() {
  // 設定為 7 格
  const [grid, setGrid] = useState(Array(7).fill(null));
  // 注意：這裡的初始值 key 要跟資料庫欄位一致 (main_theme)
  const [theme, setTheme] = useState({ main_theme: '讀取中...', sub_title: '' });
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gridRef = useRef(null);

  const fetchGrid = async () => {
    try {
      // 請記得將此處網址換成你 Render 的後端網址
      const res = await axios.get('https://youmugroupdraw.onrender.com/api/grid');
      // 確保只取前 7 筆資料
      const validGrid = res.data.grid.slice(0, 7);
      while (validGrid.length < 7) {
        validGrid.push(null);
      }
      setGrid(validGrid);
      setTheme(res.data.title);
    } catch (err) {
      console.error("Connection Error", err);
      setTheme({ main_theme: '連線失敗', sub_title: '請檢查後端' });
    }
  };

  useEffect(() => {
    fetchGrid();
  }, []);

  const getOptimizedUrl = (url) => {
    if (!url) return '';
    if (url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/w_800,q_auto,f_auto/');
    }
    return url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!file || !name) return alert('請填寫名字並選擇圖片');

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('artist_name', name);
    formData.append('image', file);

    try {
      // 請記得將此處網址換成你 Render 的後端網址
      await axios.post('https://youmugroupdraw.onrender.com/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('投稿成功！');
      setName('');
      setFile(null);
      document.getElementById('fileInput').value = ""; 
      fetchGrid();
    } catch (err) {
      alert(err.response?.data?.error || '上傳失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (gridRef.current === null) return;
    try {
      const dataUrl = await toPng(gridRef.current, { cacheBust: true, pixelRatio: 3 });
      download(dataUrl, 'touhou-group-draw.png');
    } catch (err) {
      console.error('下載失敗:', err);
      alert('圖片生成失敗，請稍後再試');
    }
  };

  return (
    <div className="App">
      
      {/* ★ 修正重點：原本外部的 header 已移除，直接開始 grid-container */}
      <div className="grid-container" ref={gridRef}>
        
        {/* ★ 修正重點：手動插入「標題卡」，它現在是網格的第一個元素 */}
        <div className="grid-item title-card">
          <div className="title-content">
             <span className="tag">主題 Theme</span>
             {/* 使用 main_theme 以符合資料庫欄位 */}
             <h1 className="main-title">{theme.main_theme}</h1>
             <h2 className="sub-title">{theme.sub_title}</h2>
          </div>
        </div>

        {/* 接下來才是 7 個圖片格子 */}
        {grid.map((slot, i) => (
          <div key={i} className="grid-item">
            <div className="img-box">
              {slot ? (
                <img 
                  src={getOptimizedUrl(slot.image_path)} 
                  alt="art" 
                  loading="lazy"
                  crossOrigin="anonymous" 
                />
              ) : (
                <span className="placeholder">空白</span>
              )}
            </div>
            {slot && (
              <div className="name-box">
                {slot.artist_name}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="upload-zone">
        <h3>✦ 繪圖投稿箱 ✦</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input 
              type="text" 
              placeholder="你的名字 / Artist Name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              disabled={isSubmitting} 
            />
          </div>
          <div className="form-row">
            <input 
              id="fileInput"
              type="file" 
              accept="image/*"
              onChange={e => setFile(e.target.files[0])}
              disabled={isSubmitting} 
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ 
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1 
              }}
            >
              {isSubmitting ? '上傳中...' : '送出'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px', paddingBottom: '40px' }}>
        <button 
          onClick={handleDownload}
          style={{ 
            backgroundColor: '#2e7d32', 
            color: 'white',
            border: 'none',
            fontSize: '1.2rem',
            padding: '12px 30px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '3px 3px 5px rgba(0,0,0,0.2)'
          }}
        >
          下載完整大圖 (Save Image)
        </button>
      </div>

    </div>
  );
}

export default App;