import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [grid, setGrid] = useState(Array(9).fill(null));
  const [theme, setTheme] = useState({ main_title: '讀取中...', sub_title: '' });
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);

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
      // 清空 file input 的小技巧
      document.getElementById('fileInput').value = ""; 
      fetchGrid();
    } catch (err) {
      alert(err.response?.data?.error || '上傳失敗');
    }
  };

  return (
    <div className="App">
      <header>
        <div className="title-group">
          <span className="tag">主題 Theme</span>
          <h1 className="main-title">{theme.main_title}</h1>
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
            />
          </div>
          <div className="form-row">
            <input 
              id="fileInput"
              type="file" 
              accept="image/*"
              onChange={e => setFile(e.target.files[0])} 
            />
            <button type="submit">送出</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;