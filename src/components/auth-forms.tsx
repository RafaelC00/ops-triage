"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticate, registerUser } from "@/lib/actions";
import { Label, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
      {message}
    </p>
  );
}

export function LoginForm() {
  const [error, action, pending] = useActionState(authenticate, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
      </div>
      <ErrorNote message={error} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        No account?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          Create one
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [error, action, pending] = useActionState(registerUser, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" placeholder="Your name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} />
      </div>
      <ErrorNote message={error} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </form>
  );
}
