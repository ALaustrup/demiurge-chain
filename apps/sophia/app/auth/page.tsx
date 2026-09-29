"use client";

import { LoginForm } from "@components/auth/LoginForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full filter blur-3xl opacity-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400 rounded-full filter blur-3xl opacity-5" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <LoginForm onSuccess={() => {
          // Redirect to dashboard
          window.location.href = "/dashboard";
        }} />
      </div>
    </div>
  );
}
