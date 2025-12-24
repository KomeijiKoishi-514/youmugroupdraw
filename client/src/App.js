import React, { useState, useEffect, useRef } from 'react'; // ★ 1. 引入 useRef
import axios from 'axios';
import { toPng } from 'html-to-image'; // ★ 2. 引入截圖工具
import download from 'downloadjs';     // ★ 3. 引入下載工具
import './App.css';

function App() {
  const [grid, setGrid] = useState(Array(9).fill(null));
  const [theme, setTheme] = useState({ main_theme: 'Loading...', sub_title: 'Loading...' });
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ★ 4. 建立一個 Ref 來綁定九宮格
  const gridRef = useRef(null);

  const fetchGrid = async () => {
    try {
      const res = await axios.get('https://youmugroupdraw.onrender.com/api/grid');
      setGrid(res.data.grid);
      setTheme(res.data.title);
    } catch (err) {
      console.error("Connection Error", err);
    }
  };

  useEffect(() => {
    fetchGrid();
  }, []);

  // Cloudinary 網址優化函式
  const getOptimizedUrl = (url) => {
    if (!url) return '';
    if (url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/w_800,q_auto,f_auto/');
    }
    return url;
  };

  const handleSubmit = async (e) => {
    // ... (這部分保持原本的邏輯，不用變) ...
    e.preventDefault();
    if (isSubmitting) return;
    if (!file || !name) return alert('請填寫名字並選擇圖片');
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('artist_name', name);
    formData.append('image', file);
    try {
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

  // ★ 5. 新增：下載圖片的功能
  const handleDownload = async () => {
    if (gridRef.current === null) {
      return;
    }

    try {
      // 這裡設定 pixelRatio: 3 可以確保輸出的圖片解析度很高 (3倍清晰)
      // cacheBust: true 可以強制瀏覽器不讀快取，避免圖片讀取失敗
      const dataUrl = await toPng(gridRef.current, { cacheBust: true, pixelRatio: 3 });
      download(dataUrl, 'touhou-group-draw.png');
    } catch (err) {
      console.error('下載失敗:', err);
      alert('圖片生成失敗，請稍後再試');
    }
  };

  return (
    <div className="App">
      <header>
        <div className="title-group">
          <span className="tag">主題 Theme</span>
          <h1 className="main-title">{theme.main_theme}</h1>
        </div>
        <div className="title-group" style={{alignItems: 'flex-end'}}>
           <h2 className="sub-title">{theme.sub_title}</h2>
        </div>
      </header>

      {/* ★ 6. 將 Ref 綁定到這個 div 上，程式就會截取這個範圍 */}
      <div className="grid-container" ref={gridRef}>
        {grid.map((slot, i) => (
          <div key={i} className="grid-item">
            <div className="img-box">
              {slot ? (
                <img 
                  src={getOptimizedUrl(slot.image_path)} 
                  alt="art" 
                  loading="lazy"
                  // ★ 7. 非常重要！加上這個屬性，允許跨域截圖，否則 Cloudinary 圖片會變成空白
                  crossOrigin="anonymous" 
                />
              ) : (
                <span className="placeholder">募集</span>
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
          {/* ... 輸入框部分保持不變 ... */}
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
              style={{ opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? '上傳中...' : '送出'}
            </button>
          </div>
        </form>
      </div>

      {/* ★ 8. 新增一個下載按鈕在最下面 */}
      <div style={{ textAlign: 'center', marginTop: '20px', paddingBottom: '40px' }}>
        <button 
          onClick={handleDownload}
          style={{ 
            backgroundColor: '#2e7d32', // 綠色按鈕區別一下
            fontSize: '1.2rem',
            padding: '12px 30px'
          }}
        >
          下載完整大圖 (Save Image)
        </button>
      </div>

    </div>
  );
}

export default App;