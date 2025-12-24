import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import './App.css';

function App() {
  const [grid, setGrid] = useState(Array(7).fill(null));
  // 預設標題先寫死，防止載入時跳動
  const [theme, setTheme] = useState({ main_theme: '讀取中...', sub_title: 'Loading...' });
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gridRef = useRef(null);

  const fetchGrid = async () => {
    try {
      // ★ 請確認這裡是你 Render 的網址
      const res = await axios.get('https://youmugroupdraw.onrender.com/api/grid');
      const validGrid = res.data.grid.slice(0, 7);
      while (validGrid.length < 7) {
        validGrid.push(null);
      }
      setGrid(validGrid);
      setTheme(res.data.title);
    } catch (err) {
      console.error("Connection Error", err);
      setTheme({ main_theme: '連線中斷', sub_title: 'System Error' });
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
    if (!file || !name) return alert('請輸入代號並上傳影像數據'); // 改個台詞

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('artist_name', name);
    formData.append('image', file);

    try {
      await axios.post('https://youmugroupdraw.onrender.com/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('傳送完畢。數據已寫入月之都資料庫。');
      setName('');
      setFile(null);
      document.getElementById('fileInput').value = ""; 
      fetchGrid();
    } catch (err) {
      alert(err.response?.data?.error || '傳送失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (gridRef.current === null) return;
    try {
      // 背景色設為深色，避免透明圖下載變黑
      const dataUrl = await toPng(gridRef.current, { 
        cacheBust: true, 
        pixelRatio: 3,
        backgroundColor: '#0a0b1e' 
      });
      download(dataUrl, 'legacy_of_lunatic_kingdom.png');
    } catch (err) {
      console.error('下載失敗:', err);
      alert('影像生成失敗');
    }
  };

  return (
    <div className="App">
      
      {/* 修復關鍵：
         所有的格子（包含標題卡）都在這個 grid-container 裡面。
         CSS Grid 會自動處理它們的位置。
      */}
      <div className="grid-container" ref={gridRef}>
        
        {/* Slot X: 標題卡 (佔 2 格) */}
        <div className="grid-item title-card">
          <div className="title-content">
             <div className="decoration-line top"></div>
             <span className="tag">PROJECT THEME</span>
             <h1 className="main-title">{theme.main_theme}</h1>
             <h2 className="sub-title">{theme.sub_title}</h2>
             <div className="decoration-line bottom"></div>
          </div>
        </div>

        {/* Slot 0-6: 圖片格 */}
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
                <div className="empty-state">
                  <span className="empty-text">NO DATA</span>
                  <span className="empty-sub">募集中</span>
                </div>
              )}
            </div>
            {slot && (
              <div className="name-box">
                <span className="artist-label">Artist:</span> {slot.artist_name}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="upload-zone">
        <h3>✦ Data Uploading... ✦</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input 
              type="text" 
              placeholder="代號 / Name" 
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
              className={isSubmitting ? 'loading' : ''}
            >
              {isSubmitting ? 'TRANSMITTING...' : 'UPLOAD'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px', paddingBottom: '40px' }}>
        <button 
          onClick={handleDownload}
          className="download-btn"
        >
           SAVE IMAGE DATA
        </button>
      </div>

    </div>
  );
}

export default App;
