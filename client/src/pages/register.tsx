import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Check, Upload, User, Target, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { playerRegistrationSchema, type PlayerRegistration } from "@shared/schema";
import { cn } from "@/lib/utils";

const roles = [
  { value: "Batsman", icon: Target, color: "text-orange-500", bg: "bg-orange-500/20" },
  { value: "Bowler", icon: CircleDot, color: "text-purple-500", bg: "bg-purple-500/20" },
  { value: "All-rounder", icon: User, color: "text-emerald-500", bg: "bg-emerald-500/20" },
] as const;

export default function Register() {
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<PlayerRegistration>({
    resolver: zodResolver(playerRegistrationSchema),
    defaultValues: {
      name: "",
      mobile: "",
      address: "",
      role: "Batsman",
      battingRating: 5,
      bowlingRating: 5,
      fieldingRating: 5,
      photoUrl: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: PlayerRegistration) => {
      const response = await apiRequest("POST", "/api/players", data);
      return response;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Registration Successful!",
        description: "You have been registered for the tournament. Good luck in the auction!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your details and try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        form.setValue("photoUrl", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: PlayerRegistration) => {
    registerMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="font-display text-4xl mb-4">You're In!</h2>
            <p className="text-muted-foreground mb-6">
              Your registration has been submitted successfully. 
              Watch the auction to see which team picks you!
            </p>
            <Button onClick={() => setIsSuccess(false)} data-testid="button-register-another">
              Register Another Player
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-4">Player Registration</h1>
          <p className="text-muted-foreground">
            Fill in your details to join the Box Cricket League
          </p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center gap-4">
                          <div 
                            className={cn(
                              "relative w-40 h-40 rounded-md border-2 border-dashed border-border overflow-hidden",
                              "flex items-center justify-center bg-muted/50 cursor-pointer",
                              "hover:border-primary/50 transition-colors"
                            )}
                            onClick={() => document.getElementById("photo-upload")?.click()}
                            data-testid="input-photo-dropzone"
                          >
                            {photoPreview ? (
                              <img 
                                src={photoPreview} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-4">
                                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Upload Photo</p>
                              </div>
                            )}
                          </div>
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          {...field} 
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="10-digit mobile number" 
                          {...field}
                          data-testid="input-mobile"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your address" 
                          className="resize-none"
                          {...field}
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Playing Role</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-3">
                          {roles.map((role) => (
                            <div
                              key={role.value}
                              className={cn(
                                "relative flex flex-col items-center gap-2 p-4 rounded-md border-2 cursor-pointer transition-all",
                                field.value === role.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              )}
                              onClick={() => field.onChange(role.value)}
                              data-testid={`input-role-${role.value.toLowerCase()}`}
                            >
                              <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", role.bg)}>
                                <role.icon className={cn("w-5 h-5", role.color)} />
                              </div>
                              <span className="text-sm font-medium">{role.value}</span>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Rate your skills from 1 to 10 (Admin may adjust later)
                  </p>

                  <FormField
                    control={form.control}
                    name="battingRating"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-orange-500" />
                            Batting
                          </FormLabel>
                          <span className="font-display text-2xl text-orange-500">{field.value}</span>
                        </div>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="py-2"
                            data-testid="input-batting-rating"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bowlingRating"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-2">
                            <CircleDot className="w-4 h-4 text-purple-500" />
                            Bowling
                          </FormLabel>
                          <span className="font-display text-2xl text-purple-500">{field.value}</span>
                        </div>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="py-2"
                            data-testid="input-bowling-rating"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fieldingRating"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-500" />
                            Fielding
                          </FormLabel>
                          <span className="font-display text-2xl text-emerald-500">{field.value}</span>
                        </div>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="py-2"
                            data-testid="input-fielding-rating"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg"
                  disabled={registerMutation.isPending}
                  data-testid="button-submit-registration"
                >
                  {registerMutation.isPending ? "Registering..." : "Complete Registration"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
