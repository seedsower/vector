import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Activity, BarChart3, Vote, Coins, Wallet, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { ConnectButton } from '@rainbow-me/rainbowkit';

const navigation = [
  { name: "Trade", href: "/", icon: Activity },
  { name: "Markets", href: "/markets", icon: BarChart3 },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Governance", href: "/governance", icon: Vote },
  { name: "Earn", href: "/earn", icon: Coins },
];

export function NavHeader() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { connected, connecting, publicKey, connect, disconnect } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center" role="banner">
        {/* Logo */}
        <div className="mr-8">
          <Link href="/" className="flex items-center space-x-2" aria-label="Vector Protocol - Home">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#FF6B00] flex items-center justify-center" aria-hidden="true">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#FF6B00] bg-clip-text text-transparent">
              Vector Protocol
            </span>
            <Badge variant="secondary" className="text-xs" aria-label="Platform type">
              Commodities DEX
            </Badge>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium" role="navigation" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));

            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`flex items-center space-x-2 ${
                    isActive
                      ? "bg-gradient-to-r from-[#00D4FF] to-[#FF6B00] text-white"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`Navigate to ${item.name}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Connection Status */}
        <div className="hidden md:flex items-center space-x-4" role="region" aria-label="Wallet connection status">
          {/* Ethereum Wallet (RainbowKit) */}
          <div className="flex items-center space-x-2">
            <ConnectButton chainStatus="icon" showBalance={false} />
          </div>

          {/* Solana Wallet */}
          <div className="flex items-center space-x-2 border-l pl-4">
            <div className="flex items-center space-x-2">
              <div
                className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`}
                aria-hidden="true"
              ></div>
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {connected ? 'Solana' : 'Solana'}
              </span>
            </div>

            {connected ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                  data-testid="wallet-address"
                  aria-label={`Connected wallet address: ${formatAddress(publicKey?.toString() || '')}`}
                >
                  <Wallet className="h-4 w-4" aria-hidden="true" />
                  <span>{formatAddress(publicKey?.toString() || '')}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnect}
                  data-testid="wallet-disconnect"
                  aria-label="Disconnect wallet"
                  title="Disconnect wallet"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Disconnect</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={connect}
                disabled={connecting}
                className="flex items-center space-x-2"
                data-testid="wallet-button"
                aria-label={connecting ? "Connecting to wallet..." : "Connect Solana Wallet"}
              >
                {connecting ? (
                  <>
                    <div
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    <span>Solana</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isOpen}
                aria-controls="mobile-navigation"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav
                id="mobile-navigation"
                className="flex flex-col space-y-4 mt-8"
                role="navigation"
                aria-label="Mobile navigation menu"
              >
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));

                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start ${
                          isActive
                            ? "bg-gradient-to-r from-[#00D4FF] to-[#FF6B00] text-white"
                            : ""
                        }`}
                        onClick={() => setIsOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={`Navigate to ${item.name}`}
                      >
                        <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                        {item.name}
                      </Button>
                    </Link>
                  );
                })}
                <div className="pt-4 border-t" role="region" aria-label="Mobile wallet connection">
                  {/* Ethereum Wallet (RainbowKit) */}
                  <div className="mb-4">
                    <span className="text-sm text-muted-foreground mb-2 block">Ethereum Wallet</span>
                    <ConnectButton chainStatus="icon" showBalance={false} />
                  </div>

                  {/* Solana Wallet */}
                  <div className="mb-4">
                    <span className="text-sm text-muted-foreground mb-2 block">Solana Wallet</span>
                    <div className="flex items-center space-x-2 mb-4">
                      <div
                        className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`}
                        aria-hidden="true"
                      ></div>
                      <span className="text-sm text-muted-foreground" aria-live="polite">
                        {connected ? 'Solana Connected' : 'Solana Devnet'}
                      </span>
                    </div>
                  </div>

                  {connected ? (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full flex items-center space-x-2"
                        data-testid="wallet-address-mobile"
                        aria-label={`Connected wallet address: ${formatAddress(publicKey?.toString() || '')}`}
                      >
                        <Wallet className="h-4 w-4" aria-hidden="true" />
                        <span>{formatAddress(publicKey?.toString() || '')}</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full flex items-center space-x-2"
                        onClick={() => {
                          disconnect();
                          setIsOpen(false);
                        }}
                        data-testid="wallet-disconnect-mobile"
                        aria-label="Disconnect wallet"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        <span>Disconnect</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full flex items-center space-x-2"
                      onClick={() => {
                        connect();
                        setIsOpen(false);
                      }}
                      disabled={connecting}
                      data-testid="wallet-button-mobile"
                      aria-label={connecting ? "Connecting to wallet..." : "Connect wallet"}
                    >
                      {connecting ? (
                        <>
                          <div
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                            aria-hidden="true"
                          />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4" aria-hidden="true" />
                          <span>Connect Wallet</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}