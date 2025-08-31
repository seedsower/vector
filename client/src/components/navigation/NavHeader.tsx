import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Activity, BarChart3, Vote, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <div className="mr-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#FF6B00] flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#FF6B00] bg-clip-text text-transparent">
              Vector Protocol
            </span>
            <Badge variant="secondary" className="text-xs">
              Commodities DEX
            </Badge>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
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
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Connection Status */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-muted-foreground">Solana Devnet</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            data-testid="wallet-button"
          >
            Connect Wallet
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-8">
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
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Button>
                    </Link>
                  );
                })}
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-muted-foreground">Solana Devnet</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    data-testid="wallet-button-mobile"
                  >
                    Connect Wallet
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}