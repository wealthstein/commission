import { Suspense } from "react";
import AuthPage from "@/components/marketing/AuthPage";

export const metadata = {
  title: "Sign up • Commission",
  description: "Create your Commission account.",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage mode="signup" />
    </Suspense>
  );
}
