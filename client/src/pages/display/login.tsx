import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Monitor, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const DISPLAY_USERNAME = "Bhulku";
const DISPLAY_PASSWORD = "weareone";

export default function DisplayLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (username === DISPLAY_USERNAME && password === DISPLAY_PASSWORD) {
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
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center mb-4">
              <Monitor className="w-10 h-10 text-white" />
            </div>
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
