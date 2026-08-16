"use client";

import React, { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  ArrowRight,
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

  // Password forms states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Bind live variables once loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setUsername(profile.displayUsername || profile.username || "");
    }
  }, [profile]);

  // Mutations
  const updateProfileMutation = trpc.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile Update");
      utils.getProfile.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile details.");
    },
  });

  const updatePasswordMutation = trpc.updatePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed");
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
    if (!name.trim() || !username.trim()) {
      toast.error("Please enter all required fields.");
      return;
    }
    await updateProfileMutation.mutateAsync({
      name: name.trim(),
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

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center gap-2 py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded flex items-center gap-2">
        <span>❌ Failed to load profile: {profileError.message}</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl flex flex-col gap-8">
      {/* PERSONAL INFORMATION */}
      <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <Label className="text-xs font-medium text-zinc-600 tracking-wide">
              Display Name
            </Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus:border-primary"
              placeholder="E.g. Administrator"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <Label className="text-xs font-medium text-zinc-600 tracking-wide">
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
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="px-5 font-bold text-xs"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save
                <Sparkles className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* SEPARATOR */}
      <div className="border-t border-zinc-200" />

      {/* CHANGE PASSWORD */}
      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-sm font-semibold tracking-wide text-foreground">
            Change Password
          </Label>
          <p className="text-xs text-zinc-500">
            Ensure your account uses a secure password.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 text-left sm:col-span-2">
            <Label className="text-xs font-medium text-zinc-600 tracking-wide">
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

          <div className="flex flex-col gap-1.5 text-left">
            <Label className="text-xs font-medium text-zinc-600 tracking-wide">
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
            <Label className="text-xs font-medium text-zinc-600 tracking-wide">
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

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={updatePasswordMutation.isPending}
            className="px-5 font-bold text-xs"
          >
            {updatePasswordMutation.isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                Update Password
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
