import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { Navigation } from "@/components/navigation";
import Home from "@/pages/home";
import Register from "@/pages/register";
import Teams from "@/pages/teams";
import Auction from "@/pages/auction";
import Matches from "@/pages/matches";
import PointsTable from "@/pages/points-table";
import Leaderboards from "@/pages/leaderboards";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import DisplayIndex from "@/pages/display/index";
import AuctionDisplay from "@/pages/display/auction-display";
import MatchDisplay from "@/pages/display/match-display";
import LeaderboardDisplay from "@/pages/display/leaderboard-display";

function MainRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/teams" component={Teams} />
      <Route path="/auction" component={Auction} />
      <Route path="/matches" component={Matches} />
      <Route path="/points-table" component={PointsTable} />
      <Route path="/leaderboards" component={Leaderboards} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DisplayRouter() {
  return (
    <Switch>
      <Route path="/display" component={DisplayIndex} />
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
              <Navigation />
              <MainRouter />
            </div>
          )}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
