// chart.js - ไฟล์สำหรับการสร้างกราฟแสดงผลข้อมูลหุ้น

// เก็บข้อมูลกราฟสากล
let priceChart = null;

/**
 * สร้างกราฟราคาจำลองสำหรับแสดงผล
 * ในการใช้งานจริงควรใช้ข้อมูลราคาย้อนหลังจริง
 * @param {number} currentPrice - ราคาปัจจุบัน
 * @param {string} ticker - สัญลักษณ์หุ้น
 */
// แก้ไขฟังก์ชัน createPriceChart เพื่อรองรับช่วงเวลา
function createPriceChart(currentPrice, ticker, timeframe = 'daily') {
    // หากมีกราฟอยู่แล้ว ให้ทำลายก่อนสร้างใหม่
    if (priceChart) {
      priceChart.destroy();
    }
    
    // สร้างข้อมูลจำลองสำหรับช่วงเวลาที่เลือก
    const simulatedData = generateSimulatedPriceData(currentPrice, timeframe);
    
    // กำหนดจำนวนวันที่จะแสดงตามช่วงเวลา
    let days;
    let dateFormat;
    
    switch(timeframe) {
      case 'weekly':
        days = 26; // แสดงข้อมูล 26 สัปดาห์
        dateFormat = 'WW/YYYY'; // สัปดาห์/ปี
        break;
      case 'monthly':
        days = 24; // แสดงข้อมูล 24 เดือน
        dateFormat = 'MM/YYYY'; // เดือน/ปี
        break;
      default: // daily
        days = 30; // แสดงข้อมูล 30 วัน
        dateFormat = 'DD/MM'; // วัน/เดือน
    }
    
    // สร้างป้ายกำกับวันที่สำหรับแกน X
    const labels = [];
    const currentDate = new Date();
    
    // สร้างป้ายกำกับวันที่ตามช่วงเวลาที่เลือก
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      
      if (timeframe === 'weekly') {
        // ย้อนหลังไปสัปดาห์ละ 7 วัน
        date.setDate(currentDate.getDate() - (i * 7));
      } else if (timeframe === 'monthly') {
        // ย้อนหลังไปเดือนละ 1 เดือน
        date.setMonth(currentDate.getMonth() - i);
      } else {
        // ย้อนหลังไปวันละ 1 วัน (กรณี daily)
        date.setDate(currentDate.getDate() - i);
      }
      
      labels.push(formatDateByTimeframe(date, timeframe));
    }
    
    // ตั้งค่ากราฟ
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    // สร้างกราฟใหม่
    priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `ราคาหุ้น ${ticker} (${getTimeframeLabel(timeframe)})`,
            data: simulatedData.prices,
            borderColor: 'rgb(41, 98, 255)',
            backgroundColor: 'rgba(41, 98, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
          {
            label: `ค่าเฉลี่ยเคลื่อนที่ (${timeframe === 'daily' ? '7 วัน' : timeframe === 'weekly' ? '4 สัปดาห์' : '3 เดือน'})`,
            data: calculateMovingAverage(simulatedData.prices, timeframe === 'daily' ? 7 : timeframe === 'weekly' ? 4 : 3),
            borderColor: 'rgba(255, 109, 0, 0.8)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'ราคา ($)'
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toFixed(2);
              }
            }
          },
          x: {
            title: {
              display: true,
              text: `วันที่ (${getTimeframeLabel(timeframe)})`
            }
          }
        }
      }
    });
  }
  
  // เพิ่มฟังก์ชันสำหรับจัดรูปแบบวันที่ตามช่วงเวลา
  function formatDateByTimeframe(date, timeframe) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // คำนวณสัปดาห์ของปี (สำหรับ timeframe แบบรายสัปดาห์)
    function getWeekNumber(d) {
      const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
      const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
    
    switch(timeframe) {
      case 'weekly':
        const week = getWeekNumber(date).toString().padStart(2, '0');
        return `${week}/${year}`;
      case 'monthly':
        return `${month}/${year}`;
      default: // daily
        return `${day}/${month}`;
    }
  }
  
// แก้ไขฟังก์ชัน createPriceChart เพื่อรองรับช่วงเวลา
function createPriceChart(currentPrice, ticker, timeframe = 'daily') {
    // หากมีกราฟอยู่แล้ว ให้ทำลายก่อนสร้างใหม่
    if (priceChart) {
      priceChart.destroy();
    }
    
    // สร้างข้อมูลจำลองสำหรับช่วงเวลาที่เลือก
    const simulatedData = generateSimulatedPriceData(currentPrice, timeframe);
    
    // กำหนดจำนวนวันที่จะแสดงตามช่วงเวลา
    let days;
    let dateFormat;
    
    switch(timeframe) {
      case 'weekly':
        days = 26; // แสดงข้อมูล 26 สัปดาห์
        dateFormat = 'WW/YYYY'; // สัปดาห์/ปี
        break;
      case 'monthly':
        days = 24; // แสดงข้อมูล 24 เดือน
        dateFormat = 'MM/YYYY'; // เดือน/ปี
        break;
      default: // daily
        days = 30; // แสดงข้อมูล 30 วัน
        dateFormat = 'DD/MM'; // วัน/เดือน
    }
    
    // สร้างป้ายกำกับวันที่สำหรับแกน X
    const labels = [];
    const currentDate = new Date();
    
    // สร้างป้ายกำกับวันที่ตามช่วงเวลาที่เลือก
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      
      if (timeframe === 'weekly') {
        // ย้อนหลังไปสัปดาห์ละ 7 วัน
        date.setDate(currentDate.getDate() - (i * 7));
      } else if (timeframe === 'monthly') {
        // ย้อนหลังไปเดือนละ 1 เดือน
        date.setMonth(currentDate.getMonth() - i);
      } else {
        // ย้อนหลังไปวันละ 1 วัน (กรณี daily)
        date.setDate(currentDate.getDate() - i);
      }
      
      labels.push(formatDateByTimeframe(date, timeframe));
    }
    
    // ตั้งค่ากราฟ
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    // สร้างกราฟใหม่
    priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `ราคาหุ้น ${ticker} (${getTimeframeLabel(timeframe)})`,
            data: simulatedData.prices,
            borderColor: 'rgb(41, 98, 255)',
            backgroundColor: 'rgba(41, 98, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
          {
            label: `ค่าเฉลี่ยเคลื่อนที่ (${timeframe === 'daily' ? '7 วัน' : timeframe === 'weekly' ? '4 สัปดาห์' : '3 เดือน'})`,
            data: calculateMovingAverage(simulatedData.prices, timeframe === 'daily' ? 7 : timeframe === 'weekly' ? 4 : 3),
            borderColor: 'rgba(255, 109, 0, 0.8)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'ราคา ($)'
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toFixed(2);
              }
            }
          },
          x: {
            title: {
              display: true,
              text: `วันที่ (${getTimeframeLabel(timeframe)})`
            }
          }
        }
      }
    });
  }
  
  // เพิ่มฟังก์ชันสำหรับจัดรูปแบบวันที่ตามช่วงเวลา
  function formatDateByTimeframe(date, timeframe) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // คำนวณสัปดาห์ของปี (สำหรับ timeframe แบบรายสัปดาห์)
    function getWeekNumber(d) {
      const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
      const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
    
    switch(timeframe) {
      case 'weekly':
        const week = getWeekNumber(date).toString().padStart(2, '0');
        return `${week}/${year}`;
      case 'monthly':
        return `${month}/${year}`;
      default: // daily
        return `${day}/${month}`;
    }
  }
  
// เพิ่มฟังก์ชันสำหรับแปลงช่วงเวลาเป็นข้อความภาษาไทย
function getTimeframeLabel(timeframe) {
    switch(timeframe) {
      case 'weekly':
        return 'รายสัปดาห์';
      case 'monthly':
        return 'รายเดือน';
      default:
        return 'รายวัน';
    }
  }

/**
 * สร้างข้อมูลราคาจำลองสำหรับแสดงผล
 * @param {number} currentPrice - ราคาปัจจุบัน
 * @returns {Object} ข้อมูลจำลอง
 */
// แก้ไขฟังก์ชัน generateSimulatedPriceData เพื่อรองรับช่วงเวลา
function generateSimulatedPriceData(currentPrice, timeframe = 'daily') {
    // กำหนดจำนวนวันตามช่วงเวลา
    let days;
    switch(timeframe) {
      case 'weekly':
        days = 26; // 26 สัปดาห์
        break;
      case 'monthly':
        days = 24; // 24 เดือน
        break;
      default: // daily
        days = 30; // 30 วัน
    }
    
    const prices = [];
    const volumes = [];
    
    // กำหนดค่าความผันผวนตามช่วงเวลา
    let volatilityFactor;
    switch(timeframe) {
      case 'weekly':
        volatilityFactor = 0.06; // ความผันผวนมากขึ้นสำหรับช่วงสัปดาห์
        break;
      case 'monthly':
        volatilityFactor = 0.08; // ความผันผวนมากขึ้นสำหรับช่วงเดือน
        break;
      default: // daily
        volatilityFactor = 0.04; // ความผันผวนปกติสำหรับรายวัน
    }
    
    // กำหนดค่าเริ่มต้นประมาณ 5-15% ต่ำกว่าราคาปัจจุบัน
    let startPrice = currentPrice * (0.85 + Math.random() * 0.1);
    
    // สร้างข้อมูลราคาจำลองแบบเดินสุ่ม (Random Walk)
    for (let i = 0; i < days; i++) {
      // ค่าความแปรปรวนร้อยละ
      const variance = (Math.random() - 0.5) * volatilityFactor;
      
      if (i === 0) {
        // เพิ่มราคาเริ่มต้น
        prices.push(startPrice);
      } else {
        // คำนวณราคาถัดไปโดยใช้ราคาก่อนหน้า + ค่าความแปรปรวน
        const previousPrice = prices[i - 1];
        const newPrice = previousPrice * (1 + variance);
        prices.push(newPrice);
      }
      
      // สร้างข้อมูลปริมาณการซื้อขายจำลอง
      const baseVolume = 1000000 + Math.random() * 9000000;
      volumes.push(Math.round(baseVolume));
    }
    
    // เพิ่มราคาในวันสุดท้ายเพื่อให้ตรงกับราคาปัจจุบัน
    prices[days - 1] = currentPrice;
    
    return {
      prices,
      volumes
    };
  }

/**
 * คำนวณค่าเฉลี่ยเคลื่อนที่ (Moving Average)
 * @param {Array<number>} data - ข้อมูลราคา
 * @param {number} period - ช่วงเวลาสำหรับคำนวณค่าเฉลี่ย
 * @returns {Array<number>} ค่าเฉลี่ยเคลื่อนที่
 */
function calculateMovingAverage(data, period) {
  const result = [];
  
  // เพิ่ม null ในช่วงแรกที่ยังไม่มีข้อมูลเพียงพอ
  for (let i = 0; i < period - 1; i++) {
    result.push(null);
  }
  
  // คำนวณค่าเฉลี่ยเมื่อมีข้อมูลเพียงพอ
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  
  return result;
}

/**
 * จัดรูปแบบวันที่เป็น DD/MM
 * @param {Date} date - วันที่
 * @returns {string} วันที่ในรูปแบบ DD/MM
 */
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}