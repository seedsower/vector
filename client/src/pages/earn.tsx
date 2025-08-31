import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { TradingHeader } from "@/components/trading/TradingHeader";

interface EarnProgram {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl: string;
  category: "liquidity" | "staking" | "farming" | "lending";
  token: string;
  lockPeriod: string;
  risk: "low" | "medium" | "high";
  multiplier?: number;
}

interface MarketMakerTier {
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  minVolume: number;
  rebateRate: number;
  benefits: string[];
  currentUsers: number;
}

const earnPrograms: EarnProgram[] = [
  {
    id: "vector-staking",
    name: "VECTOR Staking",
    description: "Stake VECTOR tokens to earn governance rewards and boost your trading rebates",
    apy: 15.5,
    tvl: "$12.5M",
    category: "staking",
    token: "VECTOR",
    lockPeriod: "7 days",
    risk: "low",
    multiplier: 1.5
  },
  {
    id: "gold-liquidity",
    name: "Gold Liquidity Pool",
    description: "Provide liquidity to XAU-USDC pool and earn trading fees + VECTOR rewards",
    apy: 22.8,
    tvl: "$8.2M",
    category: "liquidity",
    token: "XAU-USDC LP",
    lockPeriod: "None",
    risk: "medium"
  },
  {
    id: "silver-farming",
    name: "Silver Yield Farm",
    description: "Farm VECTOR tokens by providing XAG-USDC liquidity",
    apy: 31.2,
    tvl: "$4.1M",
    category: "farming",
    token: "XAG-USDC LP",
    lockPeriod: "30 days",
    risk: "medium",
    multiplier: 2.0
  },
  {
    id: "commodity-basket",
    name: "Commodity Basket Lending",
    description: "Lend to a diversified basket of tokenized commodities",
    apy: 18.7,
    tvl: "$15.8M",
    category: "lending",
    token: "Multi-asset",
    lockPeriod: "Flexible",
    risk: "low"
  },
  {
    id: "energy-futures",
    name: "Energy Futures Pool",
    description: "High-yield farming for oil and gas futures liquidity providers",
    apy: 45.3,
    tvl: "$2.9M",
    category: "farming",
    token: "Energy LP",
    lockPeriod: "60 days",
    risk: "high",
    multiplier: 3.0
  }
];

const marketMakerTiers: MarketMakerTier[] = [
  {
    tier: "bronze",
    minVolume: 0,
    rebateRate: 0.01,
    benefits: ["Basic trading rebates", "Email support"],
    currentUsers: 2450
  },
  {
    tier: "silver", 
    minVolume: 100000,
    rebateRate: 0.02,
    benefits: ["Enhanced rebates", "Priority support", "Weekly reports"],
    currentUsers: 485
  },
  {
    tier: "gold",
    minVolume: 500000,
    rebateRate: 0.03,
    benefits: ["Premium rebates", "Advanced tools", "Monthly strategy calls"],
    currentUsers: 125
  },
  {
    tier: "platinum",
    minVolume: 1000000,
    rebateRate: 0.04,
    benefits: ["Top tier rebates", "Custom API access", "Dedicated account manager"],
    currentUsers: 28
  },
  {
    tier: "diamond",
    minVolume: 5000000,
    rebateRate: 0.05,
    benefits: ["Maximum rebates", "White-glove service", "Direct protocol influence"],
    currentUsers: 7
  }
];

export default function EarnPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(0)}`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-accent text-black";
      case "medium": return "bg-secondary text-white";
      case "high": return "bg-destructive text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "staking": return "🏛️";
      case "liquidity": return "💧";
      case "farming": return "🌾";
      case "lending": return "🏦";
      default: return "💰";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "bronze": return "bg-amber-600 text-white";
      case "silver": return "bg-slate-400 text-white";
      case "gold": return "bg-yellow-500 text-black";
      case "platinum": return "bg-slate-600 text-white";
      case "diamond": return "bg-blue-600 text-white";
      default: return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TradingHeader selectedMarket={null} currentPrice={null} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold vector-primary mb-2">Vector Earn</h1>
          <p className="text-muted-foreground">
            Maximize your returns through staking, liquidity provision, and market making
          </p>
        </div>

        {/* Total Earning Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Total Value Locked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold vector-primary">
                $43.5M
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Across all programs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Your Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold vector-accent">
                $2,485.50
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Your Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold vector-secondary">
                $18,500
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Across 3 programs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Avg APY</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                23.8%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Weighted average
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-primary/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="programs" className="data-[state=active]:bg-primary data-[state=active]:text-white">Programs</TabsTrigger>
            <TabsTrigger value="market-maker" className="data-[state=active]:bg-primary data-[state=active]:text-white">Market Maker</TabsTrigger>
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-primary data-[state=active]:text-white">Portfolio</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card className="bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Quick Stake VECTOR</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Stake VECTOR tokens to earn 15.5% APY and governance rights
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount to Stake</label>
                    <Input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1 bg-background border-primary/20 focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: 25,000 VECTOR
                    </p>
                  </div>

                  <div className="p-3 bg-background/50 rounded-lg">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">APY:</span>
                        <span className="vector-accent font-medium">15.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lock Period:</span>
                        <span>7 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Multiplier:</span>
                        <span className="vector-primary font-medium">1.5x</span>
                      </div>
                    </div>
                  </div>

                  <Button className="vector-gradient-main text-white w-full">
                    Stake VECTOR
                  </Button>
                </CardContent>
              </Card>

              {/* Top Performing Programs */}
              <Card className="bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Top Performing Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {earnPrograms.sort((a, b) => b.apy - a.apy).slice(0, 4).map((program) => (
                      <div key={program.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/70 cursor-pointer transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{getCategoryIcon(program.category)}</span>
                          <div>
                            <div className="font-medium">{program.name}</div>
                            <div className="text-sm text-muted-foreground">{program.tvl} TVL</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold vector-accent">{program.apy.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">APY</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Positions */}
            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <CardTitle>Your Active Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-background/50 rounded-lg border-l-4 border-l-primary">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">VECTOR Staking</div>
                        <div className="text-sm text-muted-foreground">18,500 VECTOR</div>
                      </div>
                      <Badge className="bg-accent text-black text-xs">15.5% APY</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Earned: 450.5 VECTOR</div>
                      <div>Value: $18,500</div>
                    </div>
                  </div>

                  <div className="p-4 bg-background/50 rounded-lg border-l-4 border-l-secondary">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">Gold LP Pool</div>
                        <div className="text-sm text-muted-foreground">5.2 XAU-USDC LP</div>
                      </div>
                      <Badge className="bg-secondary text-white text-xs">22.8% APY</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Earned: $125.80</div>
                      <div>Value: $12,400</div>
                    </div>
                  </div>

                  <div className="p-4 bg-background/50 rounded-lg border-l-4 border-l-accent">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">Silver Farming</div>
                        <div className="text-sm text-muted-foreground">8.1 XAG-USDC LP</div>
                      </div>
                      <Badge className="bg-destructive text-white text-xs">31.2% APY</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Earned: $89.25</div>
                      <div>Value: $8,850</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {earnPrograms.map((program) => (
                <Card key={program.id} className="bg-card/50 border-primary/20 hover:bg-card/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedProgram(selectedProgram === program.id ? null : program.id)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getCategoryIcon(program.category)}</span>
                        <div>
                          <CardTitle className="text-lg">{program.name}</CardTitle>
                          <Badge variant="outline" className="text-xs mt-1 capitalize">
                            {program.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold vector-accent">{program.apy.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">APY</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {program.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-muted-foreground">TVL</div>
                        <div className="font-medium">{program.tvl}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Lock Period</div>
                        <div className="font-medium">{program.lockPeriod}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Token</div>
                        <div className="font-medium">{program.token}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Risk</div>
                        <Badge className={`text-xs ${getRiskColor(program.risk)}`}>
                          {program.risk.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {program.multiplier && (
                      <div className="p-2 bg-primary/10 rounded-lg mb-4">
                        <div className="text-sm font-medium vector-primary">
                          🚀 {program.multiplier}x Multiplier Active
                        </div>
                      </div>
                    )}

                    {selectedProgram === program.id && (
                      <div className="space-y-3 border-t border-border pt-4">
                        <Input
                          type="number"
                          placeholder="Amount to deposit"
                          className="bg-background border-primary/20 focus:border-primary"
                        />
                        <Button className="vector-gradient-main text-white w-full">
                          Deposit & Start Earning
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Market Maker Tab */}
          <TabsContent value="market-maker" className="space-y-6">
            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <CardTitle>Market Maker Program</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Earn rebates and rewards by providing liquidity to Vector Protocol markets
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {marketMakerTiers.map((tier, index) => (
                    <div key={tier.tier} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getTierColor(tier.tier)} text-sm px-3 py-1 capitalize`}>
                            {tier.tier}
                          </Badge>
                          <div>
                            <div className="font-medium">
                              {formatCurrency(tier.minVolume)}+ Monthly Volume
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {tier.currentUsers} active users
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold vector-accent">
                            {(tier.rebateRate * 100).toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Base Rebate</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {tier.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm">
                            <span className="w-2 h-2 bg-accent rounded-full"></span>
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>

                      {index === 0 && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                          <div className="text-sm font-medium vector-primary">
                            🎯 Your Current Tier: Bronze
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Monthly Volume: $45,200 • Next Tier: $54,800 remaining
                          </div>
                          <Progress value={45.2} className="mt-2 h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Earning History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { date: "2025-01-31", program: "VECTOR Staking", amount: "+450.5 VECTOR", value: "+$450.50" },
                      { date: "2025-01-30", program: "Gold LP Pool", amount: "+0.25 VECTOR", value: "+$125.80" },
                      { date: "2025-01-29", program: "Silver Farming", amount: "+0.18 VECTOR", value: "+$89.25" },
                      { date: "2025-01-28", program: "Market Making", amount: "+0.15 VECTOR", value: "+$75.00" },
                      { date: "2025-01-27", program: "VECTOR Staking", amount: "+425.2 VECTOR", value: "+$425.20" }
                    ].map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                        <div>
                          <div className="font-medium">{entry.program}</div>
                          <div className="text-sm text-muted-foreground">{entry.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono vector-accent">{entry.value}</div>
                          <div className="text-sm text-muted-foreground">{entry.amount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Rewards Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Claimable Rewards:</span>
                      <span className="font-mono vector-accent">$125.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Earned (30d):</span>
                      <span className="font-mono">$2,485.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Earned (All):</span>
                      <span className="font-mono">$8,924.75</span>
                    </div>
                  </div>

                  <Button className="w-full vector-gradient-main text-white">
                    Claim All Rewards
                  </Button>

                  <div className="pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-2">Next Rewards</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>VECTOR Staking:</span>
                        <span>~6h</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>LP Rewards:</span>
                        <span>~12h</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}