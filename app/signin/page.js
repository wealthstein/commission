import AuthPage from "@/components/marketing/AuthPage";

export const metadata = {
  title: "Sign in | Commission",
  description: "Sign in to your Commission account.",
};

export default function SignInPage() {
  return <AuthPage mode="signin" />;
}
