// app.js - ไฟล์ JavaScript หลักของแอปพลิเคชัน

// เลือกองค์ประกอบ DOM ที่จำเป็น
const stockTickerInput = document.getElementById('stockTickerInput');
const searchButton = document.getElementById('searchButton');
const dashboard = document.getElementById('dashboard');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// องค์ประกอบในหน้าจอแสดงผล
const stockName = document.getElementById('stockName');
const currentPrice = document.getElementById('currentPrice');
const priceChange = document.getElementById('priceChange');
const rsiGauge = document.getElementById('rsiGauge').querySelector('.gauge-fill');
const rsiValue = document.getElementById('rsiValue');
const volatilityGauge = document.getElementById('volatilityGauge').querySelector('.gauge-fill');
const volatilityValue = document.getElementById('volatilityValue');
const supportLevel = document.getElementById('supportLevel');
const resistanceLevel = document.getElementById('resistanceLevel');
const signalLight = document.getElementById('signalLight');
const signalLabel = document.getElementById('signalLabel');
const signalStrengthGauge = document.getElementById('signalStrengthGauge').querySelector('.gauge-fill');
const signalStrengthValue = document.getElementById('signalStrengthValue');
const signalReason = document.getElementById('signalReason');
const upProbability = document.getElementById('upProbability');
const downProbability = document.getElementById('downProbability');
const priceRange = document.getElementById('priceRange');
const successProbability = document.getElementById('successProbability');

// สถานะเริ่มต้น - โหลดข้อมูลหุ้น AAPL (Apple)
document.addEventListener('DOMContentLoaded', () => {
  analyzeStock('AAPL');
});

// รับการป้อนค่าจากผู้ใช้และวิเคราะห์หุ้น
searchButton.addEventListener('click', () => {
  const ticker = stockTickerInput.value.trim();
  if (ticker) {
    analyzeStock(ticker);
  }
});

// รองรับการกดปุ่ม Enter
stockTickerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const ticker = stockTickerInput.value.trim();
    if (ticker) {
      analyzeStock(ticker);
    }
  }
});

/**
 * ฟังก์ชันวิเคราะห์หุ้นโดยใช้ API และแสดงผลบนหน้าเว็บ
 * @param {string} ticker - สัญลักษณ์หุ้น เช่น AAPL
 */
// แก้ไขฟังก์ชัน analyzeStock เพื่อรองรับการกำหนดช่วงเวลา
async function analyzeStock(ticker, timeframe = 'daily') {
  // แสดงหน้าโหลด
  showLoading();
  
  try {
    // เรียกข้อมูลการวิเคราะห์จาก API พร้อมระบุช่วงเวลา
    const response = await fetch(`/api/analyze/${ticker}/${timeframe}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    
    const analysisData = await response.json();
    
    if (analysisData.error) {
      throw new Error(analysisData.error);
    }
    
    // อัปเดตหน้าจอด้วยข้อมูลที่ได้รับ
    updateDashboard(analysisData);
    
    // สร้างกราฟ
    createPriceChart(analysisData.basicInfo.currentPrice, ticker, timeframe);
    
    // แสดงแดชบอร์ด
    showDashboard();
  } catch (error) {
    console.error('Error analyzing stock:', error);
    showError(error.message);
  }
}

/**
 * อัปเดตแดชบอร์ดด้วยข้อมูลที่ได้รับจากการวิเคราะห์
 * @param {Object} data - ข้อมูลการวิเคราะห์
 */
function updateDashboard(data) {
  const { basicInfo, technicalAnalysis, signalAnalysis, probabilityAnalysis } = data;
  
  // ข้อมูลพื้นฐาน
  stockName.textContent = `${basicInfo.companyName} (${basicInfo.ticker})`;
  currentPrice.textContent = `$${basicInfo.currentPrice}`;
  
  // การเปลี่ยนแปลงราคา
  const changeText = `${technicalAnalysis.priceChange > 0 ? '+' : ''}${technicalAnalysis.priceChange} (${technicalAnalysis.priceChangePercent > 0 ? '+' : ''}${technicalAnalysis.priceChangePercent}%)`;
  priceChange.textContent = changeText;
  
  if (technicalAnalysis.priceChange > 0) {
    priceChange.className = 'price-up';
  } else if (technicalAnalysis.priceChange < 0) {
    priceChange.className = 'price-down';
  } else {
    priceChange.className = '';
  }
  
  // ตัวบ่งชี้ทางเทคนิค
  updateGauge(rsiGauge, rsiValue, technicalAnalysis.rsi, '%');
  updateGauge(volatilityGauge, volatilityValue, technicalAnalysis.volatilityPercent, '%');
  supportLevel.textContent = `$${technicalAnalysis.supportLevel}`;
  resistanceLevel.textContent = `$${technicalAnalysis.resistanceLevel}`;
  
  // สัญญาณการซื้อขาย
  updateSignal(signalAnalysis.signal, signalAnalysis.reason);
  updateGauge(signalStrengthGauge, signalStrengthValue, signalAnalysis.signalStrength, '%');
  
  // ความน่าจะเป็น
  upProbability.textContent = `${probabilityAnalysis.upProbability}%`;
  downProbability.textContent = `${probabilityAnalysis.downProbability}%`;
  priceRange.textContent = `$${probabilityAnalysis.expectedPriceRange.lowerBound} - $${probabilityAnalysis.expectedPriceRange.upperBound}`;
  successProbability.textContent = `${probabilityAnalysis.successProbability}%`;

    // ตรวจสอบข้อมูล successProbability ที่ได้รับ
  console.log("Received success probability:", 
    data.probabilityAnalysis ? data.probabilityAnalysis.successProbability : 'undefined',
    "Trading signals:", data.tradingSignals ? data.tradingSignals.successProbability : 'undefined');

// อัปเดตค่า successProbability
if (successProbability) {
// ใช้ค่าที่คำนวณมาจริงๆ แทนค่าคงที่
const probabilityValue = data.tradingSignals && data.tradingSignals.successProbability !== undefined 
? data.tradingSignals.successProbability 
: (data.probabilityAnalysis && data.probabilityAnalysis.successProbability !== undefined 
? data.probabilityAnalysis.successProbability 
: 50);

successProbability.textContent = `${probabilityValue}%`;

// ปรับสีตามค่าความน่าจะเป็น
if (probabilityValue > 70) {
successProbability.style.color = 'var(--success-color)';
} else if (probabilityValue < 40) {
successProbability.style.color = 'var(--danger-color)';
} else {
successProbability.style.color = 'var(--primary-color)';
}
}

    // เพิ่มการแสดงผลสัญญาณซื้อขาย
    if (data.tradingSignals) {
      updateTradingSignals(data.tradingSignals);
    }
    
    // เพิ่มการแสดงช่วงเวลาที่เลือก
    const timeframeDisplay = document.getElementById('timeframeDisplay');
    if (timeframeDisplay) {
      timeframeDisplay.textContent = `ช่วงเวลา: ${data.basicInfo.timeframe || 'รายวัน'}`;
    }
}

/**
 * อัปเดตเกจวัดด้วยค่าที่กำหนด
 * @param {HTMLElement} gaugeElement - องค์ประกอบเกจ
 * @param {HTMLElement} valueElement - องค์ประกอบแสดงค่า
 * @param {number} value - ค่าที่จะแสดง
 * @param {string} unit - หน่วย (เช่น %)
 */
function updateGauge(gaugeElement, valueElement, value, unit = '') {
  // ตั้งค่าความกว้างของเกจ (แปลงเป็น 0-100)
  let gaugeWidth = value;
  
  // ปรับค่า RSI ที่มีช่วง 0-100 อยู่แล้ว
  if (valueElement.id === 'rsiValue') {
    gaugeWidth = value;
  } else if (valueElement.id === 'volatilityValue') {
    // ปรับค่าความผันผวนให้อยู่ในช่วง 0-100
    gaugeWidth = Math.min(value * 5, 100);
  } else if (valueElement.id === 'signalStrengthValue') {
    // คงค่าความแข็งแกร่งของสัญญาณไว้ที่ 0-100
    gaugeWidth = value;
  }
  
  // ตั้งค่าความกว้างของเกจและข้อความ
  gaugeElement.style.width = `${gaugeWidth}%`;
  valueElement.textContent = `${value}${unit}`;
  
  // เปลี่ยนสีตามค่า
  if (valueElement.id === 'rsiValue') {
    // RSI: สูงเกิน 70 = แดง, ต่ำกว่า 30 = เขียว, อื่น ๆ = น้ำเงิน
    if (value > 70) {
      gaugeElement.style.background = 'linear-gradient(to right, #ff9800, #d50000)';
    } else if (value < 30) {
      gaugeElement.style.background = 'linear-gradient(to right, #81c784, #00c853)';
    } else {
      gaugeElement.style.background = 'linear-gradient(to right, var(--primary-light), var(--primary-color))';
    }
  }
}

/**
 * อัปเดตสัญญาณการซื้อขาย
 * @param {string} signal - สัญญาณ (BUY, SELL, NEUTRAL)
 * @param {string} reason - เหตุผลสำหรับสัญญาณ
 */
function updateSignal(signal, reason) {
  // ตั้งค่าข้อความสัญญาณ
  signalLabel.textContent = signal;
  signalReason.textContent = reason;
  
  // เปลี่ยนคลาสและสีตามสัญญาณ
  signalLight.className = 'signal-light';
  signalLabel.className = 'signal-label';
  
  if (signal === 'BUY') {
    signalLight.classList.add('buy');
    signalLabel.classList.add('buy');
  } else if (signal === 'SELL') {
    signalLight.classList.add('sell');
    signalLabel.classList.add('sell');
  }
}

/**
 * แสดงหน้าจอโหลด
 */
function showLoading() {
  dashboard.style.display = 'none';
  errorMessage.style.display = 'none';
  loadingSpinner.style.display = 'flex';
}

/**
 * แสดงแดชบอร์ด
 */
function showDashboard() {
  loadingSpinner.style.display = 'none';
  errorMessage.style.display = 'none';
  dashboard.style.display = 'block';
}

/**
 * แสดงข้อความข้อผิดพลาด
 * @param {string} message - ข้อความข้อผิดพลาด
 */
function showError(message) {
  loadingSpinner.style.display = 'none';
  dashboard.style.display = 'none';
  errorMessage.style.display = 'flex';
  errorText.textContent = message || 'ไม่พบข้อมูลหุ้นที่ระบุ กรุณาลองใหม่อีกครั้ง';
}


// เพิ่มฟังก์ชันแสดงสัญญาณซื้อขายละเอียด
function updateTradingSignals(tradingSignals) {
  const buySignalSection = document.createElement('div');
  buySignalSection.className = 'trading-signal-section';
  
  // สร้างส่วนสัญญาณซื้อ
  if (tradingSignals.buySignal.active) {
    buySignalSection.innerHTML = `
      <div class="signal-header buy-signal">
        <i class="fas fa-arrow-up"></i> สัญญาณซื้อ
      </div>
      <div class="signal-details">
        <div class="signal-item">
          <span class="signal-label">ราคาซื้อ:</span>
          <span class="signal-value">$${tradingSignals.buySignal.price}</span>
        </div>
        <div class="signal-item">
          <span class="signal-label">Stop Loss:</span>
          <span class="signal-value">$${tradingSignals.buySignal.stopLoss}</span>
        </div>
        <div class="signal-item">
          <span class="signal-label">Take Profit:</span>
          <span class="signal-value">$${tradingSignals.buySignal.takeProfit}</span>
        </div>
        <div class="signal-item">
          <span class="signal-label">โอกาสสำเร็จ:</span>
          <span class="signal-value">${tradingSignals.successProbability}%</span>
        </div>
      </div>
    `;
  } else {
    buySignalSection.innerHTML = `
      <div class="signal-header neutral-signal">
        <i class="fas fa-minus"></i> ไม่มีสัญญาณซื้อ
      </div>
    `;
  }
  
  // สร้างส่วนสัญญาณขาย
  const sellSignalSection = document.createElement('div');
  sellSignalSection.className = 'trading-signal-section';
  
  if (tradingSignals.sellSignal.active) {
    sellSignalSection.innerHTML = `
      <div class="signal-header sell-signal">
        <i class="fas fa-arrow-down"></i> สัญญาณขาย
      </div>
      <div class="signal-details">
        <div class="signal-item">
          <span class="signal-label">ราคาขาย:</span>
          <span class="signal-value">$${tradingSignals.sellSignal.price}</span>
        </div>
        <div class="signal-item">
          <span class="signal-label">Stop Loss:</span>
          <span class="signal-value">$${tradingSignals.sellSignal.stopLoss}</span>
        </div>
        <div class="signal-item">
          <span class="signal-label">Take Profit:</span>
          <span class="signal-value">$${tradingSignals.sellSignal.takeProfit}</span>
        </div>
        <div class="signal-item">
          <span class="signal-label">โอกาสสำเร็จ:</span>
          <span class="signal-value">${tradingSignals.successProbability}%</span>
        </div>
      </div>
    `;
  } else {
    sellSignalSection.innerHTML = `
      <div class="signal-header neutral-signal">
        <i class="fas fa-minus"></i> ไม่มีสัญญาณขาย
      </div>
    `;
  }
  
  // เพิ่มส่วนของ UI สำหรับแสดงผล
  const tradingSignalsContainer = document.getElementById('tradingSignalsContainer');
  tradingSignalsContainer.innerHTML = '';
  tradingSignalsContainer.appendChild(buySignalSection);
  tradingSignalsContainer.appendChild(sellSignalSection);
}

// เพิ่มฟังก์ชันสำหรับเปลี่ยนช่วงเวลา
function changeTimeframe(timeframe) {
  // เปลี่ยนสีปุ่มที่เลือกเพื่อแสดงว่าเลือกช่วงเวลาใด
  const buttons = document.querySelectorAll('.timeframe-button');
  buttons.forEach(button => {
    button.classList.remove('active');
    if (button.getAttribute('data-timeframe') === timeframe) {
      button.classList.add('active');
    }
  });
  
  const ticker = stockTickerInput.value.trim() || 'AAPL';
  analyzeStock(ticker, timeframe);
}

// เพิ่มโค้ดนี้ที่ท้ายไฟล์ app.js หรือในไฟล์ JavaScript หลัก

// เพิ่มระบบช่วยเหลือ
document.addEventListener('DOMContentLoaded', function() {
  const helpToggle = document.getElementById('helpToggle');
  const helpContent = document.getElementById('helpContent');
  const helpClose = document.getElementById('helpClose');
  
  // สร้าง overlay element
  const overlay = document.createElement('div');
  overlay.className = 'help-overlay';
  document.body.appendChild(overlay);
  
  // เปิดคู่มือการใช้งาน
  helpToggle.addEventListener('click', function() {
    helpContent.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden'; // ป้องกันการเลื่อน
  });
  
  // ปิดคู่มือการใช้งาน
  function closeHelp() {
    helpContent.style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = ''; // คืนค่าการเลื่อน
  }
  
  helpClose.addEventListener('click', closeHelp);
  overlay.addEventListener('click', closeHelp);
  
  // ปิดคู่มือเมื่อกด Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && helpContent.style.display === 'block') {
      closeHelp();
    }
  });
});