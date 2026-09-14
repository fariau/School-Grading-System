"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        role: "teacher",
      });
      router.push("/login");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(message || "Could not create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-ledger-green text-ledger-green font-serif font-semibold text-xl mb-4">
            R
          </div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Create Account</h1>
          <p className="text-sm text-muted mt-1">Set your email and password, then sign in right away</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-paper-raised border border-hairline rounded-lg p-7"
        >
          <div className="mb-4">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-hairline rounded-md bg-paper text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ledger-green/40 focus:border-ledger-green"
              placeholder="Your name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-hairline rounded-md bg-paper text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ledger-green/40 focus:border-ledger-green"
              placeholder="you@school.edu"
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-hairline rounded-md bg-paper text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ledger-green/40 focus:border-ledger-green"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-pen-red bg-pen-red-soft rounded-md px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ledger-green text-white text-sm font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create Account"}
          </button>

          <p className="text-sm text-muted text-center mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-ledger-green hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}