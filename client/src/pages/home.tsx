import { Link } from "wouter";
import { Shield, Monitor, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-4">
          <img 
            src="/spl-logo.png" 
            alt="SPL Logo" 
            className="w-40 h-40 mx-auto object-contain mb-4"
          />
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              SAMANVAY PREMIER
            </span>
            <br />
            <span className="text-foreground">LEAGUE</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            IPL-Style Box Cricket Tournament - Season 2
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin">
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary h-full"
              data-testid="card-admin-option"
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Admin Panel</CardTitle>
                <CardDescription className="text-base">
                  Manage auction, matches, players & scoring
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground pb-6">
                For tournament organizers
              </CardContent>
            </Card>
          </Link>

          <Link href="/display">
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:border-accent h-full"
              data-testid="card-display-option"
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <Monitor className="w-10 h-10 text-accent-foreground" />
                </div>
                <CardTitle className="text-2xl">Display Mode</CardTitle>
                <CardDescription className="text-base">
                  View auction, scores & leaderboards
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground pb-6">
                For screencasting & viewing
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center pt-4">
          <Link href="/register">
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:border-emerald-500 inline-block"
              data-testid="card-register-option"
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-lg">Player Registration</p>
                  <p className="text-sm text-muted-foreground">Join the tournament</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
