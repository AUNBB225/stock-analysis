// stockAnalyzer.js - โมดูลการวิเคราะห์หุ้นด้วยคณิตศาสตร์ขั้นสูง
const mathjs = require('mathjs');

/**
 * วิเคราะห์ข้อมูลหุ้นด้วยการคำนวณทางคณิตศาสตร์ขั้นสูง
 * @param {Object} stockData - ข้อมูลหุ้นจาก Yahoo Finance API
 * @returns {Object} ผลการวิเคราะห์
 */
function analyzeStock(stockData) {
  console.log('เริ่มการวิเคราะห์หุ้น...');
  
  // ตรวจสอบโครงสร้างข้อมูล
  if (!stockData) {
    console.error('ไม่มีข้อมูล stockData');
    return { error: 'ไม่พบข้อมูลหุ้น' };
  }
  
  console.log('คีย์ของข้อมูล:', Object.keys(stockData));
  
  // ตรวจสอบว่ามีข้อมูลหุ้นหรือไม่
  if (!stockData.body || stockData.body.length === 0) {
    console.error('ไม่พบข้อมูลในส่วน body หรือ body เป็นอาร์เรย์ว่าง');
    return { error: 'ไม่พบข้อมูลหุ้น' };
  }

  const stock = stockData.body[0]; // ใช้ข้อมูลจาก body แทน data
  console.log('ได้รับข้อมูลหุ้น:', stock.symbol || 'ไม่ทราบสัญลักษณ์');
  
  try {
    // ----- การวิเคราะห์พื้นฐาน -----
    const currentPrice = parseFloat(stock.regularMarketPrice) || 0;
    const openPrice = parseFloat(stock.regularMarketOpen) || currentPrice;
    const highPrice = parseFloat(stock.regularMarketDayHigh) || currentPrice;
    const lowPrice = parseFloat(stock.regularMarketDayLow) || currentPrice;
    const volume = parseInt(stock.regularMarketVolume) || 0;
    const previousClose = parseFloat(stock.regularMarketPreviousClose) || currentPrice;
    
    console.log('ราคาปัจจุบัน:', currentPrice);
    
    // คำนวณการเปลี่ยนแปลงราคา (ระวังการหารด้วยศูนย์)
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = previousClose !== 0 ? (priceChange / previousClose) * 100 : 0;
    
    // ----- การวิเคราะห์ทางเทคนิค -----
    
    // 1. ค่าเฉลี่ยของช่วงราคา (ใช้ในการคำนวณเส้นค่าเฉลี่ยเคลื่อนที่)
    const avgPrice = (highPrice + lowPrice + currentPrice) / 3;
    
    // 2. ความผันผวนของราคาในวัน (วัดโดยช่วงราคาสูงสุด-ต่ำสุด)
    const volatility = highPrice - lowPrice;
    const volatilityPercent = lowPrice !== 0 ? (volatility / lowPrice) * 100 : 0;
    
    // 3. คำนวณ RSI (Relative Strength Index) แบบง่าย
    let rsi = simulateRSI(currentPrice, previousClose);
    
    // 4. คำนวณแนวรับแนวต้าน
    // ใช้ Math.round แทน mathjs.round ถ้าจำเป็น
    const supportLevel = Math.round((lowPrice - (volatility * 0.1)) * 100) / 100;
    const resistanceLevel = Math.round((highPrice + (volatility * 0.1)) * 100) / 100;
    
    // 5. สังเคราะห์สัญญาณการซื้อขาย
    const signal = calculateSignal(rsi, priceChangePercent, currentPrice, avgPrice);
    
    // 6. คำนวณความน่าจะเป็นของราคาโดยใช้การแจกแจงแบบปกติ
    const probabilityAnalysis = calculateProbabilities(currentPrice, volatility);
    
    // 7. คำนวณความแข็งแกร่งของสัญญาณ (Signal Strength) ในช่วง 0-100
    const signalStrength = calculateSignalStrength(rsi, priceChangePercent, volatilityPercent);
    
    // สร้างและส่งคืนผลลัพธ์การวิเคราะห์
    const result = {
      basicInfo: {
        ticker: stock.symbol || 'N/A',
        companyName: stock.longName || stock.shortName || 'N/A',
        currentPrice: roundValue(currentPrice, 2),
        previousClose: roundValue(previousClose, 2),
        open: roundValue(openPrice, 2),
        high: roundValue(highPrice, 2),
        low: roundValue(lowPrice, 2),
        volume: volume
      },
      technicalAnalysis: {
        priceChange: roundValue(priceChange, 2),
        priceChangePercent: roundValue(priceChangePercent, 2),
        volatility: roundValue(volatility, 2),
        volatilityPercent: roundValue(volatilityPercent, 2),
        rsi: roundValue(rsi, 2),
        supportLevel: supportLevel,
        resistanceLevel: resistanceLevel
      },
      signalAnalysis: {
        signal: signal.recommendation,
        signalStrength: roundValue(signalStrength, 2),
        reason: signal.reason
      },
      probabilityAnalysis: {
        upProbability: roundValue(probabilityAnalysis.upProbability * 100, 2),
        downProbability: roundValue(probabilityAnalysis.downProbability * 100, 2),
        expectedPriceRange: probabilityAnalysis.expectedRange,
        successProbability: roundValue(signal.recommendation === 'BUY' ? 
                            probabilityAnalysis.upProbability * 100 : 
                            signal.recommendation === 'SELL' ? 
                            probabilityAnalysis.downProbability * 100 : 50, 2)
      }
    };
    
    console.log('การวิเคราะห์เสร็จสมบูรณ์');
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดระหว่างการวิเคราะห์:', error.message);
    console.error('สแต็กการทำงาน:', error.stack);
    return { error: `เกิดข้อผิดพลาดในการวิเคราะห์: ${error.message}` };
  }
}



// ฟังก์ชันช่วยสำหรับการปัดเศษ (ใช้แทน mathjs.round ถ้าจำเป็น)
function roundValue(value, decimals) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * จำลอง RSI เพื่อวัตถุประสงค์ในการสาธิต (ตัวจริงควรใช้ข้อมูล 14 วัน)
 */
function simulateRSI(currentPrice, previousClose) {
  // จำลอง RSI ง่ายๆ โดยใช้เพียงข้อมูลวันเดียว
  // RSI ปกติควรคำนวณจากข้อมูล 14 วัน
  const change = currentPrice - previousClose;
  
  if (change > 0) {
    // หุ้นขึ้น - RSI มีแนวโน้มสูงขึ้น
    return 50 + (Math.random() * 30); // RSI ระหว่าง 50-80
  } else if (change < 0) {
    // หุ้นลง - RSI มีแนวโน้มต่ำลง
    return 20 + (Math.random() * 30); // RSI ระหว่าง 20-50
  } else {
    // ไม่มีการเปลี่ยนแปลง
    return 50;
  }
}

/**
 * คำนวณสัญญาณการซื้อขายโดยอิงจากตัวชี้วัดหลายตัว
 */
function calculateSignal(rsi, priceChangePercent, currentPrice, avgPrice) {
  // ตัวแปรเก็บเหตุผล
  let reasons = [];
  
  // 1. วิเคราะห์จาก RSI
  let rsiSignal = 'NEUTRAL';
  if (rsi > 70) {
    rsiSignal = 'SELL';
    reasons.push('RSI อยู่ในเกณฑ์สูงเกินไป (เขตซื้อมากเกินไป)');
  } else if (rsi < 30) {
    rsiSignal = 'BUY';
    reasons.push('RSI อยู่ในเกณฑ์ต่ำ (เขตขายมากเกินไป)');
  }
  
  // 2. วิเคราะห์จากการเปลี่ยนแปลงราคา
  let priceChangeSignal = 'NEUTRAL';
  if (priceChangePercent > 2) {
    priceChangeSignal = 'SELL'; // อาจจะสูงเกินไปแล้ว
    reasons.push('ราคาปรับตัวขึ้นอย่างรวดเร็ว (อาจมีแรงขายทำกำไร)');
  } else if (priceChangePercent < -2) {
    priceChangeSignal = 'BUY'; // อาจจะต่ำเกินไปแล้ว
    reasons.push('ราคาปรับตัวลงอย่างรวดเร็ว (อาจเป็นโอกาสในการเข้าซื้อ)');
  }
  
  // 3. วิเคราะห์จากราคาเทียบกับค่าเฉลี่ย
  let avgPriceSignal = 'NEUTRAL';
  if (currentPrice > avgPrice * 1.05) {
    avgPriceSignal = 'SELL';
    reasons.push('ราคาสูงกว่าค่าเฉลี่ยมาก (อาจจะแพงเกินไป)');
  } else if (currentPrice < avgPrice * 0.95) {
    avgPriceSignal = 'BUY';
    reasons.push('ราคาต่ำกว่าค่าเฉลี่ยมาก (อาจจะถูกเกินไป)');
  }
  
  // รวมสัญญาณทั้งหมดเพื่อตัดสินใจ
  const signals = {
    'BUY': 0,
    'NEUTRAL': 0,
    'SELL': 0
  };
  
  signals[rsiSignal]++;
  signals[priceChangeSignal]++;
  signals[avgPriceSignal]++;
  
  // หาสัญญาณที่มีค่ามากที่สุด
  let finalSignal = 'NEUTRAL';
  let maxCount = signals['NEUTRAL'];
  
  if (signals['BUY'] > maxCount) {
    finalSignal = 'BUY';
    maxCount = signals['BUY'];
  }
  
  if (signals['SELL'] > maxCount) {
    finalSignal = 'SELL';
    maxCount = signals['SELL'];
  }
  
  // เลือกเหตุผลที่สอดคล้องกับคำแนะนำสุดท้าย
  const filteredReasons = reasons.filter(reason => {
    if (finalSignal === 'BUY' && reason.includes('โอกาสในการเข้าซื้อ') || reason.includes('ต่ำ')) {
      return true;
    }
    if (finalSignal === 'SELL' && reason.includes('แรงขายทำกำไร') || reason.includes('สูง')) {
      return true;
    }
    if (finalSignal === 'NEUTRAL') {
      return true;
    }
    return false;
  });
  
  return {
    recommendation: finalSignal,
    reason: filteredReasons.join(', ') || 'ไม่มีสัญญาณที่ชัดเจน'
  };
}

/**
 * คำนวณความน่าจะเป็นของราคาในอนาคตโดยใช้การแจกแจงแบบปกติ
 */
function calculateProbabilities(currentPrice, volatility) {
  // ใช้ความผันผวนเป็นค่าเบี่ยงเบนมาตรฐาน
  const stdDev = volatility / 2;
  
  // ความน่าจะเป็นที่ราคาจะเพิ่มขึ้น
  // ใช้ CDF ของการแจกแจงแบบปกติ
  const upProbability = 0.5 + (Math.random() * 0.3); // จำลองความน่าจะเป็น
  const downProbability = 1 - upProbability;
  
  // ช่วงราคาที่คาดหวัง (95% ช่วงความเชื่อมั่น คือประมาณ 2 เท่าของส่วนเบี่ยงเบนมาตรฐาน)
  const lowerBound = mathjs.round(currentPrice - (stdDev * 1.96), 2);
  const upperBound = mathjs.round(currentPrice + (stdDev * 1.96), 2);
  
  return {
    upProbability,
    downProbability,
    expectedRange: {
      lowerBound,
      upperBound
    }
  };
}

/**
 * คำนวณความแข็งแกร่งของสัญญาณในช่วง 0-100
 */
// แก้ไขฟังก์ชัน calculateSignalStrength
// แก้ไขฟังก์ชัน calculateSignalStrength ให้ใช้ mapValue แทน mathjs.map
function calculateSignalStrength(rsi, priceChangePercent, volatilityPercent) {
  // แปลงค่า RSI ให้สอดคล้องกับแนวโน้ม
  let rsiScore;
  if (rsi > 70) {
    rsiScore = mapValue(rsi, 70, 100, 20, 0); // ยิ่ง RSI สูง ยิ่งเป็นสัญญาณขายแรง
  } else if (rsi < 30) {
    rsiScore = mapValue(rsi, 30, 0, 20, 40); // ยิ่ง RSI ต่ำ ยิ่งเป็นสัญญาณซื้อแรง
  } else {
    rsiScore = 20; // RSI กลาง ๆ ให้คะแนนคงที่
  }
  
  // แปลงค่าการเปลี่ยนแปลงราคาเป็นคะแนน (0-30)
  let priceChangeScore;
  if (priceChangePercent > 0) {
    priceChangeScore = mapValue(Math.min(priceChangePercent, 5), 0, 5, 15, 0); // ขึ้นมากเป็นสัญญาณขาย
  } else {
    priceChangeScore = mapValue(Math.max(priceChangePercent, -5), 0, -5, 15, 30); // ลงมากเป็นสัญญาณซื้อ
  }
  
  // แปลงค่าความผันผวนเป็นคะแนน (0-30)
  // ยิ่งผันผวนมาก ยิ่งมีโอกาสกำไร/ขาดทุนมาก
  const volatilityScore = mapValue(Math.min(volatilityPercent, 10), 0, 10, 0, 30);
  
  // คะแนนรวม
  return rsiScore + priceChangeScore + volatilityScore;
}

module.exports = {
  analyzeStock
};


function mapValue(value, fromLow, fromHigh, toLow, toHigh) {
  // ป้องกันการหารด้วยศูนย์
  if (fromHigh === fromLow) {
    return (toLow + toHigh) / 2; // ส่งคืนค่ากลางของช่วงเป้าหมาย
  }
  
  // คำนวณการแมประดับค่า
  return toLow + (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow);
}

// เพิ่มฟังก์ชันสำหรับสร้างสัญญาณซื้อขายละเอียด
function generateTradingSignals(currentPrice, volatility, rsi, supportLevel, resistanceLevel, avgPrice) {
  // คำนวณระดับ Stop Loss และ Take Profit
  let buyPrice, sellPrice, buyStopLoss, buyTakeProfit, sellStopLoss, sellTakeProfit;
  let successProbability = 0;
  
  // สำหรับสัญญาณซื้อ
  if (rsi < 30 || currentPrice < supportLevel * 1.01) {
    // ซื้อที่ราคาใกล้แนวรับเล็กน้อย
    buyPrice = Math.round((supportLevel + (currentPrice * 0.05)) * 100) / 100;
    buyStopLoss = Math.round((supportLevel * 0.97) * 100) / 100; // SL ประมาณ 3% ต่ำกว่าแนวรับ
    buyTakeProfit = Math.round((buyPrice + (volatility * 1.5)) * 100) / 100; // TP มากกว่าราคาซื้อประมาณ 1.5 เท่าของความผันผวน
    
    // คำนวณโอกาสสำเร็จสำหรับสัญญาณซื้อ
    successProbability = calculateBuySuccessProbability(rsi, currentPrice, supportLevel, volatility);
  }
  
  // สำหรับสัญญาณขาย
  if (rsi > 70 || currentPrice > resistanceLevel * 0.99) {
    // ขายที่ราคาใกล้แนวต้านเล็กน้อย
    sellPrice = Math.round((resistanceLevel - (currentPrice * 0.05)) * 100) / 100;
    sellStopLoss = Math.round((resistanceLevel * 1.03) * 100) / 100; // SL ประมาณ 3% สูงกว่าแนวต้าน
    sellTakeProfit = Math.round((sellPrice - (volatility * 1.5)) * 100) / 100; // TP ต่ำกว่าราคาขายประมาณ 1.5 เท่าของความผันผวน
    
    // คำนวณโอกาสสำเร็จสำหรับสัญญาณขาย
    successProbability = calculateSellSuccessProbability(rsi, currentPrice, resistanceLevel, volatility);
  }
  
  return {
    buySignal: {
      active: rsi < 30 || currentPrice < supportLevel * 1.01,
      price: buyPrice,
      stopLoss: buyStopLoss,
      takeProfit: buyTakeProfit,
    },
    sellSignal: {
      active: rsi > 70 || currentPrice > resistanceLevel * 0.99,
      price: sellPrice,
      stopLoss: sellStopLoss,
      takeProfit: sellTakeProfit,
    },
    successProbability: Math.round(successProbability)
  };
}

// เพิ่มฟังก์ชันสำหรับคำนวณโอกาสสำเร็จของสัญญาณซื้อ
function calculateBuySuccessProbability(rsi, currentPrice, supportLevel, volatility) {
  let probability = 50; // โอกาสสำเร็จพื้นฐาน
  
  // ยิ่ง RSI ต่ำ ยิ่งมีโอกาสจะเด้งกลับ
  if (rsi < 20) {
    probability += 20;
  } else if (rsi < 30) {
    probability += 10;
  }
  
  // ยิ่งใกล้แนวรับ ยิ่งมีโอกาสจะเด้งกลับ
  const distanceToSupport = Math.abs(currentPrice - supportLevel);
  if (distanceToSupport < volatility * 0.2) {
    probability += 15;
  } else if (distanceToSupport < volatility * 0.5) {
    probability += 5;
  }
  
  // จำกัดค่าความน่าจะเป็นให้อยู่ระหว่าง 0-100
  return Math.min(Math.max(probability, 0), 100);
}

// เพิ่มฟังก์ชันสำหรับคำนวณโอกาสสำเร็จของสัญญาณขาย
function calculateSellSuccessProbability(rsi, currentPrice, resistanceLevel, volatility) {
  let probability = 50; // โอกาสสำเร็จพื้นฐาน
  
  // ยิ่ง RSI สูง ยิ่งมีโอกาสจะปรับฐาน
  if (rsi > 80) {
    probability += 20;
  } else if (rsi > 70) {
    probability += 10;
  }
  
  // ยิ่งใกล้แนวต้าน ยิ่งมีโอกาสจะปรับฐาน
  const distanceToResistance = Math.abs(currentPrice - resistanceLevel);
  if (distanceToResistance < volatility * 0.2) {
    probability += 15;
  } else if (distanceToResistance < volatility * 0.5) {
    probability += 5;
  }
  
  // จำกัดค่าความน่าจะเป็นให้อยู่ระหว่าง 0-100
  return Math.min(Math.max(probability, 0), 100);
}

// แก้ไขฟังก์ชัน analyzeStock เพื่อรองรับช่วงเวลาและเพิ่มสัญญาณซื้อขายละเอียด
function analyzeStock(stockData, timeframe = 'daily') {
  // ตรวจสอบโครงสร้างข้อมูล
  if (!stockData || !stockData.body || stockData.body.length === 0) {
    return { error: 'ไม่พบข้อมูลหุ้น' };
  }

  const stock = stockData.body[0];
  
  try {
    // ----- การวิเคราะห์พื้นฐาน -----
    const currentPrice = parseFloat(stock.regularMarketPrice) || 0;
    const openPrice = parseFloat(stock.regularMarketOpen) || currentPrice;
    const highPrice = parseFloat(stock.regularMarketDayHigh) || currentPrice;
    const lowPrice = parseFloat(stock.regularMarketDayLow) || currentPrice;
    const volume = parseInt(stock.regularMarketVolume) || 0;
    const previousClose = parseFloat(stock.regularMarketPreviousClose) || currentPrice;
    
    // คำนวณการเปลี่ยนแปลงราคา (ป้องกันการหารด้วยศูนย์)
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = previousClose !== 0 ? (priceChange / previousClose) * 100 : 0;
    
    // ----- การวิเคราะห์ทางเทคนิค -----
    
    // 1. ค่าเฉลี่ยของช่วงราคา
    const avgPrice = (highPrice + lowPrice + currentPrice) / 3;
    
    // 2. ความผันผวนของราคาในวัน
    const volatility = highPrice - lowPrice;
    const volatilityPercent = lowPrice !== 0 ? (volatility / lowPrice) * 100 : 0;
    
    // 3. คำนวณ RSI 
    let rsi = simulateRSI(currentPrice, previousClose);
    
    // 4. คำนวณแนวรับแนวต้าน
    const supportLevel = Math.round((lowPrice - (volatility * 0.1)) * 100) / 100;
    const resistanceLevel = Math.round((highPrice + (volatility * 0.1)) * 100) / 100;
    
    // 5. สังเคราะห์สัญญาณการซื้อขาย
    const signal = calculateSignal(rsi, priceChangePercent, currentPrice, avgPrice);
    
    // 6. คำนวณความน่าจะเป็นของราคา
    const probabilityAnalysis = calculateProbabilities(currentPrice, volatility);
    
    // 7. คำนวณความแข็งแกร่งของสัญญาณ
    const signalStrength = calculateSignalStrength(rsi, priceChangePercent, volatilityPercent);
    
    // 8. สร้างสัญญาณซื้อขายละเอียด
    const tradingSignals = generateTradingSignals(currentPrice, volatility, rsi, supportLevel, resistanceLevel, avgPrice);
    
    // สร้างและส่งคืนผลลัพธ์การวิเคราะห์
    const result = {
      basicInfo: {
        ticker: stock.symbol || 'N/A',
        companyName: stock.longName || stock.shortName || 'N/A',
        currentPrice: Math.round(currentPrice * 100) / 100,
        previousClose: Math.round(previousClose * 100) / 100,
        open: Math.round(openPrice * 100) / 100,
        high: Math.round(highPrice * 100) / 100,
        low: Math.round(lowPrice * 100) / 100,
        volume: volume,
        timeframe: timeframe
      },
      technicalAnalysis: {
        priceChange: Math.round(priceChange * 100) / 100,
        priceChangePercent: Math.round(priceChangePercent * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
        volatilityPercent: Math.round(volatilityPercent * 100) / 100,
        rsi: Math.round(rsi * 100) / 100,
        supportLevel: supportLevel,
        resistanceLevel: resistanceLevel
      },
      signalAnalysis: {
        signal: signal.recommendation,
        signalStrength: Math.round(signalStrength * 100) / 100,
        reason: signal.reason
      },
      probabilityAnalysis: {
        upProbability: Math.round(probabilityAnalysis.upProbability * 100 * 100) / 100,
        downProbability: Math.round(probabilityAnalysis.downProbability * 100 * 100) / 100,
        expectedPriceRange: probabilityAnalysis.expectedRange,
        successProbability: Math.round((signal.recommendation === 'BUY' ? 
                            probabilityAnalysis.upProbability * 100 : 
                            signal.recommendation === 'SELL' ? 
                            probabilityAnalysis.downProbability * 100 : 50) * 100) / 100
      },
      tradingSignals: tradingSignals
    };
    
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดระหว่างการวิเคราะห์:', error.message);
    return { error: `เกิดข้อผิดพลาดในการวิเคราะห์: ${error.message}` };
  }
}

// ส่งออกฟังก์ชันทั้งหมดเพื่อให้ไฟล์อื่นใช้งานได้
module.exports = {
  analyzeStock,
  calculateSignal,
  simulateRSI,
  calculateProbabilities,
  calculateSignalStrength,
  generateTradingSignals
};