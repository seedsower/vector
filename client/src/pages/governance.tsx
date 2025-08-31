import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { TradingHeader } from "@/components/trading/TradingHeader";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: "active" | "passed" | "rejected" | "pending";
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  endTime: Date;
  category: "protocol" | "treasury" | "commodities" | "partnerships";
}

interface VectorToken {
  balance: string;
  staked: string;
  votingPower: string;
  rewards: string;
}

const mockProposals: Proposal[] = [
  {
    id: "VIP-001",
    title: "Add Lithium Carbonate Futures Market",
    description: "Proposal to add lithium carbonate (LiCO3) futures market with 20x leverage, targeting the growing EV battery sector demand.",
    proposer: "0x1234...5678",
    status: "active",
    votesFor: 2450000,
    votesAgainst: 150000,
    totalVotes: 2600000,
    quorum: 2000000,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    category: "commodities"
  },
  {
    id: "VIP-002", 
    title: "Treasury Diversification into Physical Gold",
    description: "Allocate 15% of protocol treasury to physical gold backing to strengthen VECTOR token reserves.",
    proposer: "0x8765...4321",
    status: "active",
    votesFor: 1800000,
    votesAgainst: 800000,
    totalVotes: 2600000,
    quorum: 2000000,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    category: "treasury"
  },
  {
    id: "VIP-003",
    title: "Reduce Trading Fees for High-Volume Traders",
    description: "Implement tiered fee structure with up to 75% reduction for traders with >$10M monthly volume.",
    proposer: "0x9876...1234",
    status: "passed",
    votesFor: 3200000,
    votesAgainst: 400000,
    totalVotes: 3600000,
    quorum: 2000000,
    endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    category: "protocol"
  }
];

const mockVectorToken: VectorToken = {
  balance: "25,000",
  staked: "18,500", 
  votingPower: "23,750",
  rewards: "450.5"
};

export default function GovernancePage() {
  const [selectedTab, setSelectedTab] = useState("proposals");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [votingFilter, setVotingFilter] = useState<"all" | "active" | "passed" | "rejected">("all");

  const filteredProposals = mockProposals.filter(proposal => 
    votingFilter === "all" || proposal.status === votingFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-primary text-white";
      case "passed": return "bg-accent text-black";
      case "rejected": return "bg-destructive text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "protocol": return "border-l-primary";
      case "treasury": return "border-l-secondary"; 
      case "commodities": return "border-l-accent";
      case "partnerships": return "border-l-purple-500";
      default: return "border-l-muted";
    }
  };

  const formatTimeLeft = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  return (
    <div className="min-h-screen bg-background">
      <TradingHeader selectedMarket={null} currentPrice={null} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold vector-primary mb-2">Vector Governance</h1>
          <p className="text-muted-foreground">
            Participate in Vector Protocol governance using VECTOR tokens
          </p>
        </div>

        {/* Governance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Your VECTOR Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold vector-primary">
                {mockVectorToken.balance}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {mockVectorToken.staked} staked
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Voting Power</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold vector-secondary">
                {mockVectorToken.votingPower}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                1.28x multiplier
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Governance Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold vector-accent">
                {mockVectorToken.rewards}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                VECTOR earned
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Active Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockProposals.filter(p => p.status === "active").length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Requiring votes
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-primary/20">
            <TabsTrigger value="proposals" className="data-[state=active]:bg-primary data-[state=active]:text-white">Proposals</TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-primary data-[state=active]:text-white">Create</TabsTrigger>
            <TabsTrigger value="stake" className="data-[state=active]:bg-primary data-[state=active]:text-white">Stake</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white">History</TabsTrigger>
          </TabsList>

          {/* Proposals Tab */}
          <TabsContent value="proposals" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant={votingFilter === "all" ? "default" : "outline"}
                  onClick={() => setVotingFilter("all")}
                  className={votingFilter === "all" ? "vector-gradient-main text-white" : ""}
                >
                  All
                </Button>
                <Button
                  variant={votingFilter === "active" ? "default" : "outline"}
                  onClick={() => setVotingFilter("active")}
                  className={votingFilter === "active" ? "vector-gradient-main text-white" : ""}
                >
                  Active
                </Button>
                <Button
                  variant={votingFilter === "passed" ? "default" : "outline"}
                  onClick={() => setVotingFilter("passed")}
                  className={votingFilter === "passed" ? "vector-gradient-main text-white" : ""}
                >
                  Passed
                </Button>
                <Button
                  variant={votingFilter === "rejected" ? "default" : "outline"}
                  onClick={() => setVotingFilter("rejected")}
                  className={votingFilter === "rejected" ? "vector-gradient-main text-white" : ""}
                >
                  Rejected
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredProposals.map((proposal) => {
                const supportPercent = (proposal.votesFor / proposal.totalVotes) * 100;
                const quorumPercent = (proposal.totalVotes / proposal.quorum) * 100;
                
                return (
                  <Card key={proposal.id} className={`bg-card/50 border-l-4 ${getCategoryColor(proposal.category)} hover:bg-card/70 transition-colors`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="text-xs font-mono">
                              {proposal.id}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(proposal.status)}`}>
                              {proposal.status.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {proposal.category}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{proposal.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Proposed by {proposal.proposer}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {formatTimeLeft(proposal.endTime)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {proposal.description}
                      </p>
                      
                      <div className="space-y-4">
                        {/* Voting Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Support: {supportPercent.toFixed(1)}%</span>
                            <span>{proposal.votesFor.toLocaleString()} / {proposal.totalVotes.toLocaleString()} votes</span>
                          </div>
                          <Progress value={supportPercent} className="h-2" />
                        </div>

                        {/* Quorum Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Quorum: {quorumPercent.toFixed(1)}%</span>
                            <span>{proposal.totalVotes.toLocaleString()} / {proposal.quorum.toLocaleString()}</span>
                          </div>
                          <Progress value={Math.min(100, quorumPercent)} className="h-2" />
                        </div>

                        {/* Voting Buttons */}
                        {proposal.status === "active" && (
                          <div className="flex space-x-3 pt-2">
                            <Button className="vector-gradient-main text-white flex-1">
                              Vote For
                            </Button>
                            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white flex-1">
                              Vote Against
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Create Proposal Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <CardTitle>Create New Proposal</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Requires 100,000 VECTOR tokens to create a proposal
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Proposal Title</label>
                  <Input
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    placeholder="Enter proposal title..."
                    className="mt-1 bg-background border-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <select className="w-full mt-1 p-2 rounded-md bg-background border border-primary/20 focus:border-primary outline-none">
                    <option value="protocol">Protocol Changes</option>
                    <option value="treasury">Treasury Management</option>
                    <option value="commodities">New Commodities</option>
                    <option value="partnerships">Partnerships</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <Textarea
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    placeholder="Provide detailed description of your proposal..."
                    className="mt-1 min-h-32 bg-background border-primary/20 focus:border-primary"
                  />
                </div>

                <div className="pt-4">
                  <Button className="vector-gradient-main text-white w-full">
                    Create Proposal (100,000 VECTOR)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stake Tab */}
          <TabsContent value="stake" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Stake VECTOR Tokens</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Stake tokens to earn rewards and increase voting power
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount to Stake</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="mt-1 bg-background border-primary/20 focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: {mockVectorToken.balance} VECTOR
                    </p>
                  </div>

                  <div className="p-3 bg-background/50 rounded-lg">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current APY:</span>
                        <span className="vector-accent font-medium">12.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Voting Multiplier:</span>
                        <span className="vector-primary font-medium">1.25x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lock Period:</span>
                        <span>7 days</span>
                      </div>
                    </div>
                  </div>

                  <Button className="vector-gradient-main text-white w-full">
                    Stake Tokens
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20">
                <CardHeader>
                  <CardTitle>Staking Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Staked Amount:</span>
                      <span className="font-mono">{mockVectorToken.staked} VECTOR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Earned Rewards:</span>
                      <span className="font-mono vector-accent">{mockVectorToken.rewards} VECTOR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Voting Power:</span>
                      <span className="font-mono vector-primary">{mockVectorToken.votingPower}</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-black">
                      Claim Rewards
                    </Button>
                    <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white">
                      Unstake Tokens
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <CardTitle>Your Voting History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockProposals.filter(p => p.status !== "active").map((proposal) => (
                    <div key={proposal.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div>
                        <div className="font-medium">{proposal.title}</div>
                        <div className="text-sm text-muted-foreground">{proposal.id}</div>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-xs ${getStatusColor(proposal.status)}`}>
                          {proposal.status.toUpperCase()}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          Voted: For
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}