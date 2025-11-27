import { SignIn } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-6">Sign In</h1>
          <SignIn 
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/"
          />
        </div>
      </Card>
    </div>
  );
}
