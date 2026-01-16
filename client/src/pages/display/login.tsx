import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { TournamentSettings } from "@shared/schema";

export default function DisplayLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: settings } = useQuery<TournamentSettings>({
    queryKey: ["/api/tournament-settings"],
  });

  const displayUsername = settings?.displayUsername || "Bhulku";
  const displayPassword = settings?.displayPassword || "weareone";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (username === displayUsername && password === displayPassword) {
        sessionStorage.setItem("displayAuth", "true");
        toast({
          title: "Welcome!",
          description: "Display mode activated",
        });
        setLocation("/display/home");
      } else {
        toast({
          title: "Invalid Credentials",
          description: "Please check your username and password",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 auction-spotlight opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md"
      >
        <Card className="bg-white/5 border-white/10 backdrop-blur">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-4"
            >
              <img 
                src="/spl-logo.png" 
                alt="SPL Logo" 
                className="w-32 h-32 mx-auto object-contain"
              />
            </motion.div>
            <CardTitle className="font-display text-3xl text-white">DISPLAY MODE</CardTitle>
            <CardDescription className="text-gray-400">
              Enter credentials to access broadcast displays
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    data-testid="input-display-username"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    data-testid="input-display-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600"
                data-testid="button-display-login"
              >
                {isLoading ? "Logging in..." : "Access Display Mode"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
