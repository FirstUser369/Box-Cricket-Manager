import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Trophy, Users, Gavel, Play, BarChart3, Award, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Trophy },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/auction", label: "Auction", icon: Gavel },
  { href: "/matches", label: "Live", icon: Play },
  { href: "/points-table", label: "Points", icon: BarChart3 },
  { href: "/leaderboards", label: "Leaders", icon: Award },
];

export function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" data-testid="link-home-logo">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl tracking-wide hidden sm:block">
                BCL
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "gap-2",
                    location === item.href && "bg-accent"
                  )}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/admin">
              <Button variant="outline" size="sm" className="hidden sm:flex gap-2" data-testid="link-admin">
                <Shield className="w-4 h-4" />
                Admin
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    location === item.href && "bg-accent"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link href="/admin">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 mt-2"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="link-mobile-admin"
              >
                <Shield className="w-5 h-5" />
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
