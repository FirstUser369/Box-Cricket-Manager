import { Switch, Route } from "wouter";
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

function Router() {
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
