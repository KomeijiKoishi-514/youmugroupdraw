import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [grid, setGrid] = useState(Array(9).fill(null));
  const [theme, setTheme] = useState({ main_theme: 'Loading...', sub_title: '有木群群繪' });
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !name) return alert('請填寫名字並選擇圖片');
    
    // 如果正在上傳，就直接擋掉，不執行後續動作
    if (isSubmitting) return;

    // 開始上傳，鎖住按鈕
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
      // 解鎖按鈕
      setIsSubmitting(false);
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

      <div className="grid-container">
        {grid.map((slot, i) => (
          <div key={i} className="grid-item">
            <div className="img-box">
              {slot ? (
                <img src={`${slot.image_path}`} alt="art" />
              ) : (
                <span className="placeholder">空的</span>
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
              // 上傳時鎖住檔案選擇
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
    </div>
  );
}

export default App;
