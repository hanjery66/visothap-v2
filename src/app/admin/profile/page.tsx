"use client";

import React, { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  User,
  KeyRound,
  Mail,
  Fingerprint,
  Calendar,
  Lock,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function ProfilePage() {
  const utils = trpc.useUtils();

  // Load live user details
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = trpc.getProfile.useQuery();

  // Profile forms editable states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Password forms states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Bind live variables once loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setUsername(profile.displayUsername || profile.username || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  // Mutations
  const updateProfileMutation = trpc.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile details updated successfully!");
      utils.getProfile.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile details.");
    },
  });

  const updatePasswordMutation = trpc.updatePassword.useMutation({
    onSuccess: () => {
      toast.success(
        "Password changed successfully! Your session remains securely encrypted.",
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => {
      toast.error(
        err.message ||
          "Failed to change password. Please confirm your current password.",
      );
    },
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) {
      toast.error("Please enter all required fields.");
      return;
    }
    await updateProfileMutation.mutateAsync({
      name: name.trim(),
      email: email.trim(),
      username: username.trim(),
    });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please enter all required password fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    await updatePasswordMutation.mutateAsync({
      currentPassword,
      newPassword,
    });
  };

  // Get initials for avatar bubble
  const getInitials = () => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading ...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="p-4 bg-primary/20  border-primary/30 text-red-400 text-sm rounded-xl flex items-center gap-2">
        <span>❌ Failed to load profile: {profileError.message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl">
      {/* Dynamic Header */}
      <div>
        <h2 className="text-xl font-bold font-sans tracking-tight">
          Account Profile
        </h2>
        <p className="text-xs mt-1">
          Manage username, email address, system roles, and secure access
          credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: General Profile Card & Security Password Card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* PERSONAL INFORMATION FORM CARD */}
          <Card className="rounded-xl flex flex-col gap-4">
            <div className="absolute top-0 left-0 w-full h-[3px] animate-pulse" />
            <CardHeader className="px-6 pt-5 pb-0 flex flex-row items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold ">
                  Personal Information
                </CardTitle>
                <p className="text-[10px]  font-medium">
                  Update display name, credentials and registered mail address.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form
                onSubmit={handleUpdateProfile}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <Label className="text-[11px] font-bold uppercase tracking-wide">
                      Display Name
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="focus:border-primary"
                        placeholder="E.g. Administrator"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <Label className="text-[11px]  font-bold uppercase tracking-wide">
                      Username
                    </Label>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="focus:border-primary"
                      placeholder="Username..."
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                    <Label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wide">
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="focus:border-primary"
                      placeholder="Email..."
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-primary/30 pt-4 mt-2">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="px-5 font-bold text-xs"
                  >
                    {updateProfileMutation.isPending
                      ? "Saving changes..."
                      : "Save Details"}
                    <Sparkles className="h-3 w-3" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* PASSWORD RESET FORM CARD */}
          <Card className="rounded-xl flex flex-col gap-4">
            <div className="absolute top-0 left-0 w-full h-[3px] animate-pulse bg-destructive/40" />
            <CardHeader className="px-6 pt-5 pb-0 flex flex-row items-center gap-2.5">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold ">
                  Change Password
                </CardTitle>
                <p className="text-[10px]  font-medium">
                  Re-encrypt credentials with a strong cryptographic password
                  string.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form
                onSubmit={handleUpdatePassword}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5 text-left">
                  <Label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wide">
                    Current Password
                  </Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="focus:border-primary"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <Label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wide">
                      New Password
                    </Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="focus:border-primary"
                      placeholder="Min. 6 characters"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <Label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wide">
                      Confirm New Password
                    </Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="focus:border-primary"
                      placeholder="Confirm..."
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-primary/30 pt-4 mt-2">
                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    className="px-5 font-bold text-xs"
                  >
                    {updatePasswordMutation.isPending
                      ? "Encrypting..."
                      : "Update Secure Password"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Glowing Initials-Avatar Meta Panel */}
        <div className="flex flex-col gap-6 w-full">
          {/* USER INFO DISPLAY CARD */}
          <Card className="rounded-xl flex flex-col gap-4 items-center p-6 text-center">
            <div className="absolute top-0 left-0 w-full h-[3px] animate-pulse" />

            {/* Initials-Avatar Bubble */}
            <div className="relative mt-4 group">
              <div className="absolute -inset-0.5 rounded-full bg-primary/20 blur opacity-70 group-hover:opacity-100 transition duration-300" />
              <div className="relative h-20 w-20 rounded-full bg-zinc-950 border-2 border-primary flex items-center justify-center shadow-inner">
                <span className="text-xl font-bold font-mono tracking-wider text-primary select-none">
                  {getInitials()}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-bold  tracking-tight">
                {profile?.name || "System Administrator"}
              </h3>
              <p className="text-xs  font-mono mt-0.5">
                @{profile?.username || "administrator"}
              </p>
            </div>

            <div className="w-full border-t border-primary/30 my-5" />

            {/* Extra Metadata Parameters */}
            <div className="w-full flex flex-col gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded border border-primary/30 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px]  uppercase font-bold tracking-wider">
                    Mail Account
                  </span>
                  <span className="text-xs font-semibold  truncate max-w-[200px]">
                    {profile?.email || "admin@visothap.net"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded border border-primary/30 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px]  uppercase font-bold tracking-wider">
                    Created Date
                  </span>
                  <span className="text-xs font-semibold ">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
                      : "18/05/2026"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded border border-primary/30 text-muted-foreground">
                  <Fingerprint className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px]  uppercase font-bold tracking-wider">
                    Session Key ID
                  </span>
                  <span
                    className="text-[10px] font-semibold font-mono  truncate max-w-[170px]"
                    title={profile?.id}
                  >
                    {profile?.id || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* HASH UTILITY INFO */}
          <Card className="rounded-xl p-5 text-left flex gap-3 items-start">
            <Lock className="h-4 w-4 shrink-0 text-primary/80 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold  uppercase tracking-wide">
                Better Auth Cryptography
              </span>
              <p className="text-[10px] leading-relaxed">
                Passwords are securely encrypted using advanced cryptographic
                scrypt hashing algorithms. Your raw password string is never
                stored directly, guaranteeing total account safety.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
