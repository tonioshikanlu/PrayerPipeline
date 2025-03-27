import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const forgotForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof forgotPasswordSchema>) => {
      const res = await apiRequest("POST", "/api/forgot-password", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      toast({
        title: "Reset email sent",
        description: "If your email is registered, you will receive a password reset link shortly.",
      });
      
      // For development only - show debug info with token
      if (data.debug && data.debug.token) {
        toast({
          title: "Development Mode",
          description: `Reset token: ${data.debug.token}`,
          variant: "default",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof forgotPasswordSchema>) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md bg-white rounded-xl shadow-lg border-0">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto text-primary">
              <svg
                className="w-full h-full"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-neutral-800 bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
              {success ? "Check Your Email" : "Forgot Password"}
            </h1>
            <p className="mt-2 text-neutral-600">
              {success
                ? "We've sent a password reset link to your email address."
                : "Enter your email address to receive a password reset link"}
            </p>
          </div>

          {!success ? (
            <Form {...forgotForm}>
              <form
                onSubmit={forgotForm.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={forgotForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          className="w-full px-4 py-2 border-neutral-300 focus:border-primary"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 mt-6"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-center text-neutral-600">
                Didn't receive an email? Check your spam folder or try again.
              </p>
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => setSuccess(false)}
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              <span>Remember your password?</span>
              <Button
                variant="link"
                onClick={() => setLocation("/auth")}
                className="text-primary hover:text-primary/80 font-medium ml-1"
              >
                Sign in
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}