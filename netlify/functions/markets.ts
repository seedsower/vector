import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const commodityMarkets = [
  // Precious Metals
  {
    id: "gold-perp",
    symbol: "XAU-PERP",
    name: "Gold Perpetual",
    commodityType: "XAU",
    category: "PRECIOUS_METALS",
    marketType: "perpetual",
    isActive: true,
    contractSize: "1.0",
    tickSize: "0.01",
    maxLeverage: 50,
    marginRequirement: "0.02",
    metadata: null
  },
  {
    id: "silver-perp",
    symbol: "XAG-PERP",
    name: "Silver Perpetual",
    commodityType: "XAG",
    category: "PRECIOUS_METALS",
    marketType: "perpetual",
    isActive: true,
    contractSize: "10.0",
    tickSize: "0.01",
    maxLeverage: 50,
    marginRequirement: "0.02",
    metadata: null
  },
  {
    id: "platinum-perp",
    symbol: "XPT-PERP",
    name: "Platinum Perpetual",
    commodityType: "XPT",
    category: "PRECIOUS_METALS",
    marketType: "perpetual",
    isActive: true,
    contractSize: "1.0",
    tickSize: "0.01",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "palladium-perp",
    symbol: "XPD-PERP",
    name: "Palladium Perpetual",
    commodityType: "XPD",
    category: "PRECIOUS_METALS",
    marketType: "perpetual",
    isActive: true,
    contractSize: "1.0",
    tickSize: "0.01",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  // Energy
  {
    id: "oil-perp",
    symbol: "CL-PERP",
    name: "Crude Oil Perpetual",
    commodityType: "CL",
    category: "ENERGY",
    marketType: "perpetual",
    isActive: true,
    contractSize: "1.0",
    tickSize: "0.01",
    maxLeverage: 50,
    marginRequirement: "0.02",
    metadata: null
  },
  {
    id: "brent-perp",
    symbol: "BRENT-PERP",
    name: "Brent Crude Perpetual",
    commodityType: "BRENT",
    category: "ENERGY",
    marketType: "perpetual",
    isActive: true,
    contractSize: "1.0",
    tickSize: "0.01",
    maxLeverage: 50,
    marginRequirement: "0.02",
    metadata: null
  },
  {
    id: "natgas-perp",
    symbol: "NG-PERP",
    name: "Natural Gas Perpetual",
    commodityType: "NG",
    category: "ENERGY",
    marketType: "perpetual",
    isActive: true,
    contractSize: "10.0",
    tickSize: "0.001",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "gasoline-perp",
    symbol: "RB-PERP",
    name: "Gasoline Perpetual",
    commodityType: "RB",
    category: "ENERGY",
    marketType: "perpetual",
    isActive: true,
    contractSize: "1.0",
    tickSize: "0.001",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "heating-oil-perp",
    symbol: "HO-PERP",
    name: "Heating Oil Perpetual",
    commodityType: "HO",
    category: "ENERGY",
    marketType: "perpetual",
    isActive: true,
    contractSize: "1.0",
    tickSize: "0.001",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  // Agriculture
  {
    id: "wheat-perp",
    symbol: "ZW-PERP",
    name: "Wheat Perpetual",
    commodityType: "ZW",
    category: "AGRICULTURE",
    marketType: "perpetual",
    isActive: true,
    contractSize: "100.0",
    tickSize: "0.01",
    maxLeverage: 50,
    marginRequirement: "0.02",
    metadata: null
  },
  {
    id: "corn-perp",
    symbol: "ZC-PERP",
    name: "Corn Perpetual",
    commodityType: "ZC",
    category: "AGRICULTURE",
    marketType: "perpetual",
    isActive: true,
    contractSize: "100.0",
    tickSize: "0.01",
    maxLeverage: 50,
    marginRequirement: "0.02",
    metadata: null
  },
  {
    id: "soybean-perp",
    symbol: "ZS-PERP",
    name: "Soybean Perpetual",
    commodityType: "ZS",
    category: "AGRICULTURE",
    marketType: "perpetual",
    isActive: true,
    contractSize: "100.0",
    tickSize: "0.01",
    maxLeverage: 50,
    marginRequirement: "0.02",
    metadata: null
  },
  {
    id: "cotton-perp",
    symbol: "CT-PERP",
    name: "Cotton Perpetual",
    commodityType: "CT",
    category: "AGRICULTURE",
    marketType: "perpetual",
    isActive: true,
    contractSize: "50.0",
    tickSize: "0.01",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "sugar-perp",
    symbol: "SB-PERP",
    name: "Sugar Perpetual",
    commodityType: "SB",
    category: "AGRICULTURE",
    marketType: "perpetual",
    isActive: true,
    contractSize: "112.0",
    tickSize: "0.01",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "coffee-perp",
    symbol: "KC-PERP",
    name: "Coffee Perpetual",
    commodityType: "KC",
    category: "AGRICULTURE",
    marketType: "perpetual",
    isActive: true,
    contractSize: "37.5",
    tickSize: "0.01",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "cocoa-perp",
    symbol: "CC-PERP",
    name: "Cocoa Perpetual",
    commodityType: "CC",
    category: "AGRICULTURE",
    marketType: "perpetual",
    isActive: true,
    contractSize: "10.0",
    tickSize: "0.01",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "lumber-perp",
    symbol: "LB-PERP",
    name: "Lumber Perpetual",
    commodityType: "LB",
    category: "AGRICULTURE",
    marketType: "perpetual",
    isActive: true,
    contractSize: "110.0",
    tickSize: "0.01",
    maxLeverage: 30,
    marginRequirement: "0.033",
    metadata: null
  },
  // Industrial Metals
  {
    id: "copper-perp",
    symbol: "HG-PERP",
    name: "Copper Perpetual",
    commodityType: "HG",
    category: "INDUSTRIAL_METALS",
    marketType: "perpetual",
    isActive: true,
    contractSize: "25.0",
    tickSize: "0.0001",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "aluminum-perp",
    symbol: "ALU-PERP",
    name: "Aluminum Perpetual",
    commodityType: "ALU",
    category: "INDUSTRIAL_METALS",
    marketType: "perpetual",
    isActive: true,
    contractSize: "25.0",
    tickSize: "0.01",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "zinc-perp",
    symbol: "ZN-PERP",
    name: "Zinc Perpetual",
    commodityType: "ZN",
    category: "INDUSTRIAL_METALS",
    marketType: "perpetual",
    isActive: true,
    contractSize: "25.0",
    tickSize: "0.01",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "nickel-perp",
    symbol: "NI-PERP",
    name: "Nickel Perpetual",
    commodityType: "NI",
    category: "INDUSTRIAL_METALS",
    marketType: "perpetual",
    isActive: true,
    contractSize: "6.0",
    tickSize: "0.01",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "lead-perp",
    symbol: "PB-PERP",
    name: "Lead Perpetual",
    commodityType: "PB",
    category: "INDUSTRIAL_METALS",
    marketType: "perpetual",
    isActive: true,
    contractSize: "25.0",
    tickSize: "0.01",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
  },
  {
    id: "tin-perp",
    symbol: "SN-PERP",
    name: "Tin Perpetual",
    commodityType: "SN",
    category: "INDUSTRIAL_METALS",
    marketType: "perpetual",
    isActive: true,
    contractSize: "5.0",
    tickSize: "0.01",
    maxLeverage: 40,
    marginRequirement: "0.025",
    metadata: null
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
      body: JSON.stringify(commodityMarkets)
    };
  }

  // Method not allowed
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
