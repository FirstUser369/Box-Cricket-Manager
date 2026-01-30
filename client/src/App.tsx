import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import DisplayLogin from "@/pages/display/login";
import DisplayIndex from "@/pages/display/index";
import DisplayRegister from "@/pages/display/register";
import MatchDisplay from "@/pages/display/match-display";
import LeaderboardDisplay from "@/pages/display/leaderboard-display";
import PointsTableDisplay from "@/pages/display/points-table";

// TWO INTERFACES ONLY:
// 1. /admin - Admin controls (auction, matches, approvals, scoring)
// 2. /display - Display mode for screencasting (no controls)

function MainRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DisplayRouter() {
  const isAuthenticated = sessionStorage.getItem("displayAuth") === "true";
  
  return (
    <Switch>
      <Route path="/display" component={DisplayLogin} />
      <Route path="/display/home">
        {isAuthenticated ? <DisplayIndex /> : <Redirect to="/display" />}
      </Route>
      <Route path="/display/register" component={DisplayRegister} />
      <Route path="/display/match">
        {isAuthenticated ? <MatchDisplay /> : <Redirect to="/display" />}
      </Route>
      <Route path="/display/leaderboard">
        {isAuthenticated ? <LeaderboardDisplay /> : <Redirect to="/display" />}
      </Route>
      <Route path="/display/points-table">
        {isAuthenticated ? <PointsTableDisplay /> : <Redirect to="/display" />}
      </Route>
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
