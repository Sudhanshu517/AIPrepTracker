import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Code, Trophy, Target, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    setLocation("/sign-in");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Main Auth Card */}
        <Card className="w-full max-w-md mx-auto mb-8 shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Code className="text-white text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AIPrepTracker</h1>
              <p className="text-gray-600 mt-2">AI-powered analytics for your coding interview journey</p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleLogin}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
              >
                Sign In to Continue
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trophy className="text-success text-xl" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600 text-sm">Track your progress across LeetCode, GeeksforGeeks, and TUF+ with smart insights</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-warning text-xl" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Visual Analytics</h3>
              <p className="text-gray-600 text-sm">Visualize your growth with AI-driven analytics and performance metrics</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="text-primary text-xl" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Recommendations</h3>
              <p className="text-gray-600 text-sm">Get personalized, AI-generated problem suggestions tailored to your coding style</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
