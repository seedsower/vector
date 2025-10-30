import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// Generate realistic prices with some randomness for demonstration
const generatePrice = (base: number, volatility: number = 0.02) => {
  const change = (Math.random() - 0.5) * volatility;
  return (base * (1 + change)).toFixed(2);
};

const generateVolume = (base: number) => {
  return (base * (0.8 + Math.random() * 0.4)).toFixed(0);
};

const generateChange = () => {
  return ((Math.random() - 0.48) * 5).toFixed(2);
};

const prices = [
  // Precious Metals
  {
    id: "gold-price",
    marketId: "gold-perp",
    price: generatePrice(2045.50, 0.01),
    volume24h: generateVolume(1250000),
    change24h: generateChange(),
    high24h: generatePrice(2065.80, 0.01),
    low24h: generatePrice(2025.10, 0.01),
    openInterest: "500000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(2045.30, 0.01),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "silver-price",
    marketId: "silver-perp",
    price: generatePrice(24.85, 0.02),
    volume24h: generateVolume(850000),
    change24h: generateChange(),
    high24h: generatePrice(25.40, 0.02),
    low24h: generatePrice(24.20, 0.02),
    openInterest: "200000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(24.83, 0.02),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "platinum-price",
    marketId: "platinum-perp",
    price: generatePrice(965.40, 0.015),
    volume24h: generateVolume(420000),
    change24h: generateChange(),
    high24h: generatePrice(980.20, 0.015),
    low24h: generatePrice(952.30, 0.015),
    openInterest: "150000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(965.10, 0.015),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "palladium-price",
    marketId: "palladium-perp",
    price: generatePrice(1125.80, 0.02),
    volume24h: generateVolume(320000),
    change24h: generateChange(),
    high24h: generatePrice(1145.90, 0.02),
    low24h: generatePrice(1102.50, 0.02),
    openInterest: "120000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(1125.40, 0.02),
    lastUpdated: new Date().toISOString()
  },
  // Energy
  {
    id: "oil-price",
    marketId: "oil-perp",
    price: generatePrice(78.95, 0.025),
    volume24h: generateVolume(2100000),
    change24h: generateChange(),
    high24h: generatePrice(81.50, 0.025),
    low24h: generatePrice(76.20, 0.025),
    openInterest: "800000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(78.92, 0.025),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "brent-price",
    marketId: "brent-perp",
    price: generatePrice(82.45, 0.025),
    volume24h: generateVolume(1850000),
    change24h: generateChange(),
    high24h: generatePrice(84.90, 0.025),
    low24h: generatePrice(80.10, 0.025),
    openInterest: "750000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(82.40, 0.025),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "natgas-price",
    marketId: "natgas-perp",
    price: generatePrice(3.42, 0.035),
    volume24h: generateVolume(980000),
    change24h: generateChange(),
    high24h: generatePrice(3.58, 0.035),
    low24h: generatePrice(3.28, 0.035),
    openInterest: "420000",
    fundingRate: "0.0002",
    indexPrice: generatePrice(3.41, 0.035),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "gasoline-price",
    marketId: "gasoline-perp",
    price: generatePrice(2.15, 0.03),
    volume24h: generateVolume(650000),
    change24h: generateChange(),
    high24h: generatePrice(2.24, 0.03),
    low24h: generatePrice(2.08, 0.03),
    openInterest: "280000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(2.14, 0.03),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "heating-oil-price",
    marketId: "heating-oil-perp",
    price: generatePrice(2.58, 0.028),
    volume24h: generateVolume(520000),
    change24h: generateChange(),
    high24h: generatePrice(2.68, 0.028),
    low24h: generatePrice(2.50, 0.028),
    openInterest: "220000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(2.57, 0.028),
    lastUpdated: new Date().toISOString()
  },
  // Agriculture
  {
    id: "wheat-price",
    marketId: "wheat-perp",
    price: generatePrice(6.45, 0.025),
    volume24h: generateVolume(420000),
    change24h: generateChange(),
    high24h: generatePrice(6.62, 0.025),
    low24h: generatePrice(6.30, 0.025),
    openInterest: "150000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(6.44, 0.025),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "corn-price",
    marketId: "corn-perp",
    price: generatePrice(4.82, 0.025),
    volume24h: generateVolume(580000),
    change24h: generateChange(),
    high24h: generatePrice(4.95, 0.025),
    low24h: generatePrice(4.70, 0.025),
    openInterest: "220000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(4.81, 0.025),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "soybean-price",
    marketId: "soybean-perp",
    price: generatePrice(14.35, 0.022),
    volume24h: generateVolume(720000),
    change24h: generateChange(),
    high24h: generatePrice(14.68, 0.022),
    low24h: generatePrice(14.10, 0.022),
    openInterest: "320000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(14.33, 0.022),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "cotton-price",
    marketId: "cotton-perp",
    price: generatePrice(0.82, 0.028),
    volume24h: generateVolume(280000),
    change24h: generateChange(),
    high24h: generatePrice(0.85, 0.028),
    low24h: generatePrice(0.80, 0.028),
    openInterest: "95000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(0.82, 0.028),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "sugar-price",
    marketId: "sugar-perp",
    price: generatePrice(0.24, 0.03),
    volume24h: generateVolume(380000),
    change24h: generateChange(),
    high24h: generatePrice(0.25, 0.03),
    low24h: generatePrice(0.23, 0.03),
    openInterest: "140000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(0.24, 0.03),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "coffee-price",
    marketId: "coffee-perp",
    price: generatePrice(1.75, 0.032),
    volume24h: generateVolume(450000),
    change24h: generateChange(),
    high24h: generatePrice(1.82, 0.032),
    low24h: generatePrice(1.69, 0.032),
    openInterest: "180000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(1.74, 0.032),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "cocoa-price",
    marketId: "cocoa-perp",
    price: generatePrice(3.85, 0.035),
    volume24h: generateVolume(220000),
    change24h: generateChange(),
    high24h: generatePrice(4.02, 0.035),
    low24h: generatePrice(3.70, 0.035),
    openInterest: "85000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(3.84, 0.035),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "lumber-price",
    marketId: "lumber-perp",
    price: generatePrice(485.50, 0.04),
    volume24h: generateVolume(180000),
    change24h: generateChange(),
    high24h: generatePrice(510.20, 0.04),
    low24h: generatePrice(465.80, 0.04),
    openInterest: "65000",
    fundingRate: "0.0002",
    indexPrice: generatePrice(484.90, 0.04),
    lastUpdated: new Date().toISOString()
  },
  // Industrial Metals
  {
    id: "copper-price",
    marketId: "copper-perp",
    price: generatePrice(3.82, 0.025),
    volume24h: generateVolume(920000),
    change24h: generateChange(),
    high24h: generatePrice(3.95, 0.025),
    low24h: generatePrice(3.72, 0.025),
    openInterest: "380000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(3.81, 0.025),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "aluminum-price",
    marketId: "aluminum-perp",
    price: generatePrice(2.28, 0.022),
    volume24h: generateVolume(650000),
    change24h: generateChange(),
    high24h: generatePrice(2.36, 0.022),
    low24h: generatePrice(2.22, 0.022),
    openInterest: "280000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(2.27, 0.022),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "zinc-price",
    marketId: "zinc-perp",
    price: generatePrice(2.45, 0.025),
    volume24h: generateVolume(480000),
    change24h: generateChange(),
    high24h: generatePrice(2.54, 0.025),
    low24h: generatePrice(2.38, 0.025),
    openInterest: "195000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(2.44, 0.025),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "nickel-price",
    marketId: "nickel-perp",
    price: generatePrice(17.85, 0.028),
    volume24h: generateVolume(420000),
    change24h: generateChange(),
    high24h: generatePrice(18.45, 0.028),
    low24h: generatePrice(17.30, 0.028),
    openInterest: "175000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(17.82, 0.028),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "lead-price",
    marketId: "lead-perp",
    price: generatePrice(2.15, 0.024),
    volume24h: generateVolume(320000),
    change24h: generateChange(),
    high24h: generatePrice(2.22, 0.024),
    low24h: generatePrice(2.09, 0.024),
    openInterest: "125000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(2.14, 0.024),
    lastUpdated: new Date().toISOString()
  },
  {
    id: "tin-price",
    marketId: "tin-perp",
    price: generatePrice(25.40, 0.03),
    volume24h: generateVolume(280000),
    change24h: generateChange(),
    high24h: generatePrice(26.30, 0.03),
    low24h: generatePrice(24.65, 0.03),
    openInterest: "95000",
    fundingRate: "0.0001",
    indexPrice: generatePrice(25.35, 0.03),
    lastUpdated: new Date().toISOString()
  }
];

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Handle GET request
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(prices)
    };
  }

  // Method not allowed
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
