import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TradingHeader } from "@/components/trading/TradingHeader";
import { CommodityCategory } from "@shared/schema";

interface AnalyticsData {
  overview: {
    totalVolume24h: string;
    totalTrades24h: number;
    activeMarkets: number;
    totalOpenInterest: string;
    averageSpread: string;
    platformTvl: string;
  };
  commodities: Array<{
    category: CommodityCategory;
    volume24h: string;
    changePercent: string;
    topPerformer: { symbol: string; change: string };
    marketCount: number;
    averageVolatility: string;
  }>;
  volumes: {
    hourly: Array<{ time: string; volume: string }>;
    daily: Array<{ date: string; volume: string }>;
    byCategory: Array<{ category: string; volume: string; percentage: number }>;
    topMarkets: Array<{ symbol: string; volume: string; change: string }>;
  };
  fees: {
    totalFeesCollected: string;
    averageFeeRate: string;
    feesByCategory: Array<{ category: string; fees: string }>;
    rebatesPaid: string;
    netFeeRevenue: string;
  };
  riskMetrics: {
    totalPositionsAtRisk: number;
    averageHealthFactor: string;
    liquidationBuffer: string;
    concentrationRisk: Array<{ commodity: string; exposure: string; percentage: number }>;
    correlationMatrix: Array<{ commodity1: string; commodity2: string; correlation: number }>;
  };
}

const COLORS = ['#00D4FF', '#FF6B00', '#00FF88', '#FF3366', '#FFD700', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "90d">("24h");
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/full", timeframe],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: oracleHealth } = useQuery({
    queryKey: ["/api/oracle/health"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatPercent = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TradingHeader selectedMarket={null} currentPrice={null} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold vector-primary mb-2">Vector Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into commodities trading performance and market data
            </p>
          </div>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 bg-background border-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="30d">30d</SelectItem>
              <SelectItem value="90d">90d</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card/50 border border-primary/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="volumes" className="data-[state=active]:bg-primary data-[state=active]:text-white">Volumes</TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-primary data-[state=active]:text-white">Risk</TabsTrigger>
            <TabsTrigger value="fees" className="data-[state=active]:bg-primary data-[state=active]:text-white">Fees</TabsTrigger>
            <TabsTrigger value="oracles" className="data-[state=active]:bg-primary data-[state=active]:text-white">Oracles</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-card/50 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Total Volume (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold vector-primary">
                    {formatCurrency(analytics.overview.totalVolume24h)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analytics.overview.totalTrades24h.toLocaleString()} trades
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Platform TVL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold vector-secondary">
                    {formatCurrency(analytics.overview.platformTvl)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analytics.overview.activeMarkets} active markets
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Open Interest</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold vector-accent">
                    {formatCurrency(analytics.overview.totalOpenInterest)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Avg spread: {analytics.overview.averageSpread}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Commodity Categories Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.commodities.map((category, index) => {
                      const isPositive = parseFloat(category.changePercent) >= 0;
                      return (
                        <div key={category.category} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <div>
                              <div className="font-medium capitalize">
                                {category.category.replace('_', ' ').toLowerCase()}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {category.marketCount} markets
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono">
                              {formatCurrency(category.volume24h)}
                            </div>
                            <div className={`text-sm font-mono ${isPositive ? 'trading-green' : 'trading-red'}`}>
                              {formatPercent(category.changePercent)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Volume Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.volumes.byCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {analytics.volumes.byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Volumes Tab */}
          <TabsContent value="volumes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Hourly Volume Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.volumes.hourly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value: any) => [formatCurrency(value), 'Volume']} />
                      <Area 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="#00D4FF" 
                        fill="url(#volumeGradient)" 
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Top Markets by Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.volumes.topMarkets.slice(0, 8).map((market, index) => (
                      <div key={market.symbol} className="flex items-center justify-between p-2 rounded bg-background/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{market.symbol}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            {formatCurrency(market.volume)}
                          </div>
                          <div className={`text-xs font-mono ${parseFloat(market.change) >= 0 ? 'trading-green' : 'trading-red'}`}>
                            {formatPercent(market.change)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-card/50 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Positions at Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {analytics.riskMetrics.totalPositionsAtRisk}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Require attention</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Avg Health Factor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold vector-accent">
                    {analytics.riskMetrics.averageHealthFactor}
                  </div>
                  <Progress 
                    value={parseFloat(analytics.riskMetrics.averageHealthFactor) * 50} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Liquidation Buffer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold vector-primary">
                    {formatCurrency(analytics.riskMetrics.liquidationBuffer)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Available buffer</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Concentration Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.riskMetrics.concentrationRisk.map((risk, index) => (
                      <div key={risk.commodity} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{risk.commodity}</span>
                          <span className="text-sm text-muted-foreground">
                            {risk.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={risk.percentage} className="h-2" />
                        <div className="text-right text-xs text-muted-foreground">
                          {formatCurrency(risk.exposure)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Correlation Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.riskMetrics.correlationMatrix.map((corr, index) => {
                      const strength = Math.abs(corr.correlation);
                      const isPositive = corr.correlation >= 0;
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-background/50">
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {corr.commodity1} ↔ {corr.commodity2}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`text-sm font-mono ${isPositive ? 'trading-green' : 'trading-red'}`}>
                              {corr.correlation.toFixed(2)}
                            </div>
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${isPositive ? 'bg-accent' : 'bg-destructive'}`}
                                style={{ width: `${strength * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-card/50 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Total Fees Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold vector-primary">
                    {formatCurrency(analytics.fees.totalFeesCollected)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Avg rate: {analytics.fees.averageFeeRate}%
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Rebates Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold vector-secondary">
                    {formatCurrency(analytics.fees.rebatesPaid)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">To market makers</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Net Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold vector-accent">
                    {formatCurrency(analytics.fees.netFeeRevenue)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">After rebates</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <CardTitle>Fee Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.fees.feesByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="category" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: any) => [formatCurrency(value), 'Fees']} />
                    <Bar dataKey="fees" fill="#00D4FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Oracles Tab */}
          <TabsContent value="oracles" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {oracleHealth && Object.entries(oracleHealth).map(([name, health]) => (
                <Card key={name} className="bg-card/50 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{name}</span>
                      <Badge 
                        variant={health.status === 'healthy' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {health.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Confidence:</span>
                        <span className="font-mono text-sm">{(health.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last Update:</span>
                        <span className="font-mono text-sm">
                          {Math.floor((Date.now() - health.lastUpdate) / 1000)}s ago
                        </span>
                      </div>
                      <Progress value={health.confidence * 100} className="mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <CardTitle>Oracle Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <p>Multi-oracle aggregation system with real-time confidence scoring</p>
                  <p className="text-sm mt-2">Pyth Network • Switchboard • Chainlink • Vector Custom</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}