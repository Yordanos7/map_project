"use client";

import { useState } from "react";

import SignInForm from "@/components/SignInForm";
import SignUpForm from "@/components/SignUpForm";

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(false);

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
