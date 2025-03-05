// server.js - เซิร์ฟเวอร์ Node.js หลัก
const express = require('express');
const axios = require('axios');
const path = require('path');
const stockAnalyzer = require('./stockAnalyzer');

const app = express();
const PORT = process.env.PORT || 3000;

// ใช้ middleware สำหรับไฟล์สแตติก
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// เส้นทาง API เพื่อรับข้อมูลหุ้น
app.get('/api/stock/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    
    // เรียก Yahoo Finance API
    const response = await axios.get(`https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/quotes`, {
      params: { ticker },
      headers: {
        'X-Rapidapi-Key': '8fb89317f5msh22b7daf073b8cafp13e075jsn41a1bbebd104',
        'X-Rapidapi-Host': 'yahoo-finance15.p.rapidapi.com'
      }
    });
    
    // ส่งข้อมูลดิบกลับให้ไคลเอนต์
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// เส้นทาง API สำหรับการวิเคราะห์หุ้น
// ในไฟล์ server.js - เพิ่มเติมเส้นทาง API ให้รองรับช่วงเวลา
app.get('/api/analyze/:ticker/:timeframe?', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const timeframe = req.params.timeframe || 'daily'; // ค่าเริ่มต้นเป็น daily หากไม่ได้ระบุ
    
    console.log(`กำลังวิเคราะห์หุ้น: ${ticker} ช่วงเวลา: ${timeframe}`);
    
    // เรียก API Yahoo Finance
    const response = await axios.get(`https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/quotes`, {
      params: { ticker },
      headers: {
        'X-Rapidapi-Key': '8fb89317f5msh22b7daf073b8cafp13e075jsn41a1bbebd104',
        'X-Rapidapi-Host': 'yahoo-finance15.p.rapidapi.com'
      }
    });
    
    try {
      // วิเคราะห์ข้อมูลโดยใช้โมดูล stockAnalyzer พร้อมพารามิเตอร์ timeframe
      const analysis = stockAnalyzer.analyzeStock(response.data, timeframe);
      res.json(analysis);
    } catch (analysisError) {
      console.error('ข้อผิดพลาดในการวิเคราะห์:', analysisError);
      res.status(500).json({ error: `ข้อผิดพลาดในการวิเคราะห์: ${analysisError.message}` });
    }
  } catch (error) {
    console.error('ข้อผิดพลาดในการดึงข้อมูล:', error);
    res.status(500).json({ error: `ไม่สามารถดึงข้อมูลได้: ${error.message}` });
  }
});
// เส้นทางหลักสำหรับเว็บแอป
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});