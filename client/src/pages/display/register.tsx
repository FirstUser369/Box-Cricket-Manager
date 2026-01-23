import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Upload, User, Target, CircleDot, Loader2, Mail, Phone, Shirt, DollarSign, CreditCard, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { playerRegistrationSchema, type PlayerRegistration, type TournamentSettings } from "@shared/schema";
import { cn } from "@/lib/utils";
import imageCompression from "browser-image-compression";
import { QRCodeSVG } from "qrcode.react";

const roles = [
  { value: "Batsman", icon: Target, color: "text-orange-500", bg: "bg-orange-500/20" },
  { value: "Bowler", icon: CircleDot, color: "text-purple-500", bg: "bg-purple-500/20" },
  { value: "All-rounder", icon: User, color: "text-emerald-500", bg: "bg-emerald-500/20" },
] as const;

const tshirtSizes = ["S", "M", "L", "XL"] as const;

export default function DisplayRegister() {
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const { data: settings } = useQuery<TournamentSettings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<PlayerRegistration>({
    resolver: zodResolver(playerRegistrationSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      address: "",
      role: "Batsman",
      tshirtSize: "M",
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const options = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 400,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setPhotoPreview(base64);
          form.setValue("photoUrl", base64);
          setIsCompressing(false);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Error compressing image:", error);
        setIsCompressing(false);
        toast({
          title: "Photo Error",
          description: "Could not process the photo. Please try a smaller image.",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (data: PlayerRegistration) => {
    registerMutation.mutate(data);
  };

  if (isSuccess) {
    const registrationFee = settings?.registrationFee || 25;
    const hasZelle = settings?.zellePhone || settings?.zelleEmail;
    const hasCashApp = settings?.cashappId;
    const hasVenmo = settings?.venmoId;

    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="mb-6 bg-white/5 border-white/10">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="font-display text-4xl mb-4 text-white">You're In!</h2>
              <p className="text-gray-400 mb-2">
                Your registration has been submitted successfully!
              </p>
              <p className="text-gray-400">
                Please complete the payment below to confirm your spot in the auction.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Payment Required
              </CardTitle>
              <CardDescription className="text-gray-400">
                Registration Fee: <span className="font-bold text-white">${registrationFee}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasZelle && (
                <div className="p-4 rounded-md border border-white/10 bg-white/5">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-white">
                    <CreditCard className="w-4 h-4" />
                    Zelle
                  </h4>
                  <div className="space-y-1 text-sm text-gray-400">
                    {settings?.zellePhone && <p>Phone: {settings.zellePhone}</p>}
                    {settings?.zelleEmail && <p>Email: {settings.zelleEmail}</p>}
                  </div>
                  {settings?.zelleQrUrl && (
                    <div className="mt-3 flex justify-center">
                      <div className="bg-white p-2 rounded-md">
                        <QRCodeSVG value={settings.zelleQrUrl} size={120} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasCashApp && (
                <div className="p-4 rounded-md border border-white/10 bg-white/5">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-white">
                    <CreditCard className="w-4 h-4" />
                    Cash App
                  </h4>
                  <p className="text-sm text-gray-400">ID: {settings?.cashappId}</p>
                  {settings?.cashappQrUrl && (
                    <div className="mt-3 flex justify-center">
                      <div className="bg-white p-2 rounded-md">
                        <QRCodeSVG value={settings.cashappQrUrl} size={120} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasVenmo && (
                <div className="p-4 rounded-md border border-white/10 bg-white/5">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-white">
                    <CreditCard className="w-4 h-4" />
                    Venmo
                  </h4>
                  <p className="text-sm text-gray-400">ID: {settings?.venmoId}</p>
                  {settings?.venmoQrUrl && (
                    <div className="mt-3 flex justify-center">
                      <div className="bg-white p-2 rounded-md">
                        <QRCodeSVG value={settings.venmoQrUrl} size={120} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!hasZelle && !hasCashApp && !hasVenmo && (
                <div className="p-4 rounded-md border border-white/10 bg-white/5 text-center">
                  <p className="text-gray-400">
                    Payment methods will be announced soon. Please check back later!
                  </p>
                </div>
              )}

              <div className="p-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-center">
                <p className="text-sm text-gray-300">
                  After payment, your registration will be verified by the admin.
                  You'll be eligible for the auction once verified!
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setIsSuccess(false)}
              className="border-white/20 text-white hover:bg-white/10"
              data-testid="button-register-another"
            >
              Register Another Player
            </Button>
            <Link href="/display">
              <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Display
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/display">
            <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-4 text-glow-purple">PLAYER REGISTRATION</h1>
          <p className="text-gray-400">
            Fill in your details to join the Box Cricket League
          </p>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Photo</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center gap-4">
                          <div 
                            className={cn(
                              "relative w-40 h-40 rounded-md border-2 border-dashed border-white/20 overflow-hidden",
                              "flex items-center justify-center bg-white/5 cursor-pointer",
                              "hover:border-purple-500/50 transition-colors"
                            )}
                            onClick={() => document.getElementById("photo-upload")?.click()}
                            data-testid="input-photo-dropzone"
                          >
                            {isCompressing ? (
                              <div className="text-center p-4">
                                <Loader2 className="w-8 h-8 mx-auto mb-2 text-purple-500 animate-spin" />
                                <p className="text-sm text-gray-400">Compressing...</p>
                              </div>
                            ) : photoPreview ? (
                              <img 
                                src={photoPreview} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-4">
                                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-400">Upload Photo</p>
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
                      <FormLabel className="text-gray-300">Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                          {...field} 
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-300">
                          <Phone className="w-4 h-4" />
                          Mobile Number
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="10-digit mobile number" 
                            className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-300">
                          <Mail className="w-4 h-4" />
                          Email (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="your@email.com" 
                            className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tshirtSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-300">
                          <Shirt className="w-4 h-4" />
                          T-Shirt Size (US)
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/20 text-white" data-testid="input-tshirt-size">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tshirtSizes.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your address" 
                          className="resize-none bg-white/5 border-white/20 text-white placeholder:text-gray-500"
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
                      <FormLabel className="text-gray-300">Playing Role</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-3">
                          {roles.map((role) => (
                            <div
                              key={role.value}
                              className={cn(
                                "relative flex flex-col items-center gap-2 p-4 rounded-md border-2 cursor-pointer transition-all",
                                field.value === role.value
                                  ? "border-purple-500 bg-purple-500/10"
                                  : "border-white/20 hover:border-purple-500/30"
                              )}
                              onClick={() => field.onChange(role.value)}
                              data-testid={`input-role-${role.value.toLowerCase()}`}
                            >
                              <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", role.bg)}>
                                <role.icon className={cn("w-5 h-5", role.color)} />
                              </div>
                              <span className="text-sm font-medium text-white">{role.value}</span>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-6 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400">
                    Rate your skills from 1 to 10 (Admin may adjust later)
                  </p>

                  <FormField
                    control={form.control}
                    name="battingRating"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-2 text-gray-300">
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
                          <FormLabel className="flex items-center gap-2 text-gray-300">
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
                          <FormLabel className="flex items-center gap-2 text-gray-300">
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
                  className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600"
                  disabled={registerMutation.isPending || isCompressing}
                  data-testid="button-submit-registration"
                >
                  {registerMutation.isPending ? "Registering..." : isCompressing ? "Processing Photo..." : "Complete Registration"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
