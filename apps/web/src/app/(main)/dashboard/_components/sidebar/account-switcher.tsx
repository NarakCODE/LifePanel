"use client";

import { useState } from "react";

import Link from "next/link";

import { BadgeCheck, Bell, Check, CreditCard, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser, useLogout } from "@/hooks/use-auth-queries";
import { cn, getInitials } from "@/lib/utils";

export function AccountSwitcher({
  users,
}: {
  readonly users: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
    readonly role: string;
  }>;
}) {
  const { data: currentUser } = useCurrentUser();
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogout();
  const [activeUser, setActiveUser] = useState(users[0]);

  // Use the authenticated user's real profile when logged in, fallback to mock user otherwise
  const displayUser = currentUser
    ? {
        id: currentUser.identity.id,
        name: currentUser.profile.displayName,
        email: currentUser.identity.email,
        avatar: currentUser.profile.avatarUrl || "",
        role: currentUser.identity.roles?.[0] || "member",
      }
    : activeUser;

  if (!displayUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 rounded-lg cursor-pointer">
          <AvatarImage src={displayUser.avatar || undefined} alt={displayUser.name} />
          <AvatarFallback>{getInitials(displayUser.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        {currentUser ? (
          <div className="flex w-full items-center gap-2 px-2 py-2 bg-accent/20 rounded-md">
            <Avatar className="size-9 rounded-lg">
              <AvatarImage src={displayUser.avatar || undefined} alt={displayUser.name} />
              <AvatarFallback>{getInitials(displayUser.name)}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{displayUser.name}</span>
              <span className="truncate text-xs capitalize text-muted-foreground">{displayUser.role}</span>
            </div>
          </div>
        ) : (
          users.map((user) => (
            <DropdownMenuItem
              key={user.email}
              className={cn("p-0", user.id === displayUser.id && "bg-accent/50")}
              aria-current={user.id === displayUser.id ? "true" : undefined}
              onClick={() => setActiveUser(user)}
            >
              <div className="flex w-full items-center gap-2 px-1 py-1.5">
                <Avatar className="size-9 rounded-lg">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs capitalize">{user.role}</span>
                </div>
                <span
                  className={cn(
                    "mr-1 flex size-5 items-center justify-center rounded-full text-primary opacity-0",
                    user.id === displayUser.id && "opacity-100",
                  )}
                >
                  <Check aria-hidden="true" />
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/account">
              <BadgeCheck />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="text-destructive focus:text-destructive"
        >
          {isLoggingOut ? <Spinner className="size-4 mr-2" /> : <LogOut className="size-4 mr-2 text-destructive" />}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
