// indicators.js - ไฟล์สำหรับคำนวณตัวชี้วัดทางเทคนิคของหุ้น
// ไฟล์นี้มีไว้สำหรับการขยายฟังก์ชันในอนาคต เช่น การคำนวณ RSI, MACD, Bollinger Bands จริงๆ

/**
 * คำนวณ RSI (Relative Strength Index) จากข้อมูลราคาปิด
 * @param {Array<number>} closePrices - ข้อมูลราคาปิดย้อนหลัง
 * @param {number} period - ช่วงเวลาสำหรับการคำนวณ (ปกติคือ 14 วัน)
 * @returns {number} ค่า RSI (0-100)
 */
function calculateRSI(closePrices, period = 14) {
    // ต้องมีข้อมูลอย่างน้อย period + 1 วัน
    if (closePrices.length <= period) {
      return 50; // ค่าเริ่มต้น
    }
    
    // คำนวณการเปลี่ยนแปลงของราคา
    const priceChanges = [];
    for (let i = 1; i < closePrices.length; i++) {
      priceChanges.push(closePrices[i] - closePrices[i - 1]);
    }
    
    // แยกการเปลี่ยนแปลงเป็นบวกและลบ
    const gains = priceChanges.map(change => change > 0 ? change : 0);
    const losses = priceChanges.map(change => change < 0 ? Math.abs(change) : 0);
    
    // คำนวณค่าเฉลี่ยของกำไรและขาดทุนในช่วงเวลา
    let avgGain = 0;
    let avgLoss = 0;
    
    // คำนวณค่าเฉลี่ยเริ่มต้น
    for (let i = 0; i < period; i++) {
      avgGain += gains[i];
      avgLoss += losses[i];
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    // คำนวณค่าเฉลี่ยสำหรับวันที่เหลือโดยใช้สูตรการเฉลี่ยเคลื่อนที่แบบถ่วงน้ำหนัก
    for (let i = period; i < priceChanges.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    }
    
    // ป้องกันการหารด้วยศูนย์
    if (avgLoss === 0) {
      return 100;
    }
    
    // คำนวณ Relative Strength (RS)
    const rs = avgGain / avgLoss;
    
    // คำนวณ RSI
    const rsi = 100 - (100 / (1 + rs));
    return rsi;
  }
  
  /**
   * คำนวณแถบโบลิงเจอร์ (Bollinger Bands)
   * @param {Array<number>} closePrices - ข้อมูลราคาปิดย้อนหลัง
   * @param {number} period - ช่วงเวลาสำหรับการคำนวณ (ปกติคือ 20 วัน)
   * @param {number} stdDev - จำนวนเท่าของส่วนเบี่ยงเบนมาตรฐาน (ปกติคือ 2)
   * @returns {Object} แถบโบลิงเจอร์ {upperBand, middleBand, lowerBand}
   */
  function calculateBollingerBands(closePrices, period = 20, stdDev = 2) {
    // คำนวณค่าเฉลี่ยเคลื่อนที่ (SMA)
    const sma = calculateSMA(closePrices, period);
    
    // คำนวณส่วนเบี่ยงเบนมาตรฐาน
    const standardDeviation = calculateStandardDeviation(closePrices, period, sma);
    
    // คำนวณแถบบนและล่าง
    const upperBand = sma + (standardDeviation * stdDev);
    const lowerBand = sma - (standardDeviation * stdDev);
    
    return {
      upperBand,
      middleBand: sma,
      lowerBand
    };
  }
  
  /**
   * คำนวณค่าเฉลี่ยเคลื่อนที่แบบเรียบง่าย (Simple Moving Average)
   * @param {Array<number>} data - ข้อมูลราคา
   * @param {number} period - ช่วงเวลาสำหรับการคำนวณ
   * @returns {number} ค่าเฉลี่ยเคลื่อนที่
   */
  function calculateSMA(data, period) {
    if (data.length < period) {
      return data.reduce((sum, value) => sum + value, 0) / data.length;
    }
    
    // ใช้ข้อมูล period วันล่าสุด
    const slice = data.slice(-period);
    return slice.reduce((sum, value) => sum + value, 0) / period;
  }
  
  /**
   * คำนวณส่วนเบี่ยงเบนมาตรฐาน
   * @param {Array<number>} data - ข้อมูลราคา
   * @param {number} period - ช่วงเวลา
   * @param {number} mean - ค่าเฉลี่ย (ถ้าคำนวณไว้แล้ว)
   * @returns {number} ส่วนเบี่ยงเบนมาตรฐาน
   */
  function calculateStandardDeviation(data, period, mean = null) {
    if (data.length < period) {
      return 0;
    }
    
    const slice = data.slice(-period);
    
    // คำนวณค่าเฉลี่ยถ้าไม่ได้ให้มา
    const avg = mean !== null ? mean : calculateSMA(slice, slice.length);
    
    // คำนวณผลรวมของส่วนต่างกำลังสอง
    const squaredDiffSum = slice.reduce((sum, value) => {
      const diff = value - avg;
      return sum + (diff * diff);
    }, 0);
    
    // คำนวณส่วนเบี่ยงเบนมาตรฐาน
    return Math.sqrt(squaredDiffSum / period);
  }
  
  /**
   * คำนวณ MACD (Moving Average Convergence Divergence)
   * @param {Array<number>} closePrices - ข้อมูลราคาปิดย้อนหลัง
   * @param {number} fastPeriod - ช่วงเวลาสั้น (ปกติคือ 12)
   * @param {number} slowPeriod - ช่วงเวลายาว (ปกติคือ 26)
   * @param {number} signalPeriod - ช่วงเวลาสัญญาณ (ปกติคือ 9)
   * @returns {Object} ค่า MACD {macdLine, signalLine, histogram}
   */
  function calculateMACD(closePrices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    // คำนวณค่าเฉลี่ยเคลื่อนที่แบบเอ็กซ์โพเนนเชียล (EMA)
    const fastEMA = calculateEMA(closePrices, fastPeriod);
    const slowEMA = calculateEMA(closePrices, slowPeriod);
    
    // คำนวณ MACD Line
    const macdLine = fastEMA - slowEMA;
    
    // คำนวณ Signal Line (EMA ของ MACD Line)
    // ในกรณีนี้เราจะใช้ค่าเฉลี่ยปกติแทนเพื่อความง่าย
    const signalLine = macdLine * 0.8; // จำลองค่า Signal Line อย่างง่าย
    
    // คำนวณ Histogram
    const histogram = macdLine - signalLine;
    
    return {
      macdLine,
      signalLine,
      histogram
    };
  }
  
  /**
   * คำนวณค่าเฉลี่ยเคลื่อนที่แบบเอ็กซ์โพเนนเชียล (Exponential Moving Average)
   * จำลองเพื่อแสดงแนวคิด
   * @param {Array<number>} data - ข้อมูลราคา
   * @param {number} period - ช่วงเวลา
   * @returns {number} EMA
   */
  function calculateEMA(data, period) {
    if (data.length < period) {
      return calculateSMA(data, data.length);
    }
    
    // ในกรณีนี้เราจะคำนวณค่าเฉลี่ยปกติเพื่อความง่าย
    // ในการใช้งานจริง ควรคำนวณ EMA อย่างถูกต้อง
    return calculateSMA(data, period);
  }
  
  // ส่งออกฟังก์ชันทั้งหมดเพื่อให้ไฟล์อื่นใช้งานได้
  // แต่ในโค้ดตัวอย่างนี้ เรายังไม่ได้ใช้ฟังก์ชันเหล่านี้ในแอปพลิเคชัน
  // เตรียมไว้สำหรับการพัฒนาต่อในอนาคต
  window.technicalIndicators = {
    calculateRSI,
    calculateBollingerBands,
    calculateMACD,
    calculateSMA,
    calculateEMA
  };