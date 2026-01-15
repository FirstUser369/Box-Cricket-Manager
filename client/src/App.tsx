import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import Admin from "@/pages/admin";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import DisplayIndex from "@/pages/display/index";
import DisplayRegister from "@/pages/display/register";
import AuctionDisplay from "@/pages/display/auction-display";
import MatchDisplay from "@/pages/display/match-display";
import LeaderboardDisplay from "@/pages/display/leaderboard-display";

// TWO INTERFACES ONLY:
// 1. /admin - Admin controls (auction, matches, approvals, scoring)
// 2. /display - Display mode for screencasting (no controls)

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin" component={Admin} />
      <Route path="/register" component={Register} />
      <Route path="/">
        <Redirect to="/admin" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function DisplayRouter() {
  return (
    <Switch>
      <Route path="/display" component={DisplayIndex} />
      <Route path="/display/register" component={DisplayRegister} />
      <Route path="/display/auction" component={AuctionDisplay} />
      <Route path="/display/match" component={MatchDisplay} />
      <Route path="/display/leaderboard" component={LeaderboardDisplay} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isDisplayMode = location.startsWith("/display");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {isDisplayMode ? (
            <DisplayRouter />
          ) : (
            <div className="min-h-screen bg-background text-foreground">
              <AdminRouter />
            </div>
          )}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
