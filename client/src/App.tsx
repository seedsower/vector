import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './lib/wagmi';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WalletProvider } from "@/contexts/WalletContext";
import NotFound from "@/pages/not-found";
import TradePage from "@/pages/trade";
import MarketsPage from "@/pages/markets";
import AnalyticsPage from "@/pages/analytics";
import GovernancePage from "@/pages/governance";
import EarnPage from "@/pages/earn";
import '@rainbow-me/rainbowkit/styles.css';

function Router() {
  return (
    <Switch>
      <Route path="/" component={TradePage} />
      <Route path="/trade" component={TradePage} />
      <Route path="/markets" component={MarketsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/governance" component={GovernancePage} />
      <Route path="/earn" component={EarnPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <WalletProvider>
              <TooltipProvider>
                <div className="dark">
                  <Toaster />
                  <Router />
                </div>
              </TooltipProvider>
            </WalletProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

export default App;
