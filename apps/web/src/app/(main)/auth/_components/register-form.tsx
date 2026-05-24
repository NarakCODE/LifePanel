"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { authApi } from "@/lib/api-client";

const formSchema = z
  .object({
    displayName: z.string().min(2, { message: "Display Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string().min(8, { message: "Confirm Password must be at least 8 characters." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

interface RegisterFormProps {
  header?: React.ReactNode;
  socialButtons?: React.ReactNode;
  footer?: React.ReactNode;
}

export function RegisterForm({ header, socialButtons, footer }: RegisterFormProps) {
  const router = useRouter();
  const [showVerification, setShowVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsRegistering(true);
    try {
      const response = await authApi.register(data.email, data.password, data.displayName);
      if (response.success) {
        toast.success("Account Created!", {
          description: "A 6-digit verification code has been sent to your email.",
        });
        setRegisteredEmail(data.email);
        setShowVerification(true);
      } else {
        throw new Error(response.message || "Registration failed.");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error("Registration Failed", {
        description: msg,
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const onVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("Invalid Code", {
        description: "Please enter the full 6-digit verification code.",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await authApi.verifyEmail(registeredEmail, otpCode);
      if (response.success) {
        toast.success("Account Verified!", {
          description: "Your email has been verified successfully. You can now log in!",
        });
        router.push("login");
      } else {
        throw new Error(response.message || "Verification failed.");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error("Verification Failed", {
        description: msg,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await authApi.resendVerification(registeredEmail);
      if (response.success) {
        toast.success("Code Resent", {
          description: "A new 6-digit verification code has been sent to your email.",
        });
      } else {
        throw new Error(response.message || "Resend failed.");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error("Resend Failed", {
        description: msg,
      });
    } finally {
      setIsResending(false);
    }
  };

  if (showVerification) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl">Verify your email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a verification code to <span className="font-medium text-foreground">{registeredEmail}</span>.
          </p>
        </div>

        <form onSubmit={onVerifySubmit} className="flex flex-col gap-5 text-center">
          <div className="flex justify-center my-2">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} disabled={isVerifying}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex flex-col gap-2">
            <Button className="w-full" type="submit" disabled={isVerifying || otpCode.length !== 6}>
              {isVerifying && <Spinner className="mr-2 border-white" />}
              Verify Account
            </Button>
            <div className="flex justify-between items-center text-xs mt-2 px-1">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || isVerifying}
                className="text-primary hover:underline disabled:opacity-50 cursor-pointer"
              >
                {isResending ? "Resending..." : "Resend Code"}
              </button>
              <button
                type="button"
                onClick={() => setShowVerification(false)}
                disabled={isVerifying}
                className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
              >
                Change Email / Sign Up
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {header}
      {socialButtons}
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FieldGroup className="gap-4">
          <Controller
            control={form.control}
            name="displayName"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-name">Full Name</FieldLabel>
                <Input
                  {...field}
                  id="register-name"
                  type="text"
                  placeholder="John Doe"
                  disabled={isRegistering}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-email">Email Address</FieldLabel>
                <Input
                  {...field}
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isRegistering}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-password">Password</FieldLabel>
                <Input
                  {...field}
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isRegistering}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-confirm-password">Confirm Password</FieldLabel>
                <Input
                  {...field}
                  id="register-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isRegistering}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
        <Button className="w-full" type="submit" disabled={isRegistering}>
          {isRegistering && <Spinner className="mr-2 border-white" />}
          Register
        </Button>
      </form>
      {footer}
    </div>
  );
}
