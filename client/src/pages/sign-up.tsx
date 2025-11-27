import { SignUp } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
          <SignUp 
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/"
          />
        </div>
      </Card>
    </div>
  );
}
