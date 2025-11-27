import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Code, BarChart3, Target, Trophy, Lightbulb, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useClerk } from "@clerk/clerk-react";

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", path: "/", active: location === "/" },
    { icon: Target, label: "Problems", path: "/problems", active: location === "/problems" },
    { icon: Trophy, label: "Progress", path: "/progress", active: location === "/progress" },
    { icon: Lightbulb, label: "Recommendations", path: "/recommendations", active: location === "/recommendations" },
    { icon: Settings, label: "Settings", path: "/settings", active: location === "/settings" },
  ];

  return (
    <>
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(true)}
            className="text-gray-600"
          >
            <Menu size={20} />
          </Button>
          <h1 className="font-semibold text-gray-900">Dashboard</h1>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="User avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-sm font-medium">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                      <Code className="text-white" size={20} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">AIPrep</h2>
                      <p className="text-sm text-gray-500">Tracker</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-400"
                  >
                    <X size={20} />
                  </Button>
                </div>
              </div>

              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <Link href={item.path}>
                        <a
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${item.active
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-gray-600 hover:bg-gray-100"
                            }`}
                          onClick={() => setIsMenuOpen(false)}
                          data-testid={`link-nav-mobile-${item.label.toLowerCase().replace(' ', '-')}`}
                        >
                          <item.icon size={20} />
                          <span>{item.label}</span>
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-3 px-3 py-2">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="User avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <LogOut size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
