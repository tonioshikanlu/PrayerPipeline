import { useLocation } from "wouter";
import { Home, Users, Heart, User } from "lucide-react";

type MobileNavProps = {
  active: "home" | "groups" | "prayers" | "profile";
};

export default function MobileNav({ active }: MobileNavProps) {
  const [_, navigate] = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 py-2 md:hidden">
      <div className="grid grid-cols-4 gap-1">
        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center justify-center py-1 ${
            active === "home" ? "text-primary" : "text-neutral-500 hover:text-primary"
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button
          onClick={() => {
            // Navigate to the first group if available or show all groups
            navigate("/groups");
          }}
          className={`flex flex-col items-center justify-center py-1 ${
            active === "groups" ? "text-primary" : "text-neutral-500 hover:text-primary"
          }`}
        >
          <Users className="h-6 w-6" />
          <span className="text-xs mt-1">Groups</span>
        </button>
        <button
          onClick={() => {
            // Navigate to prayer requests
            navigate("/prayers");
          }}
          className={`flex flex-col items-center justify-center py-1 ${
            active === "prayers" ? "text-primary" : "text-neutral-500 hover:text-primary"
          }`}
        >
          <Heart className="h-6 w-6" />
          <span className="text-xs mt-1">Prayers</span>
        </button>
        <button
          onClick={() => {
            // Navigate to profile
            navigate("/profile");
          }}
          className={`flex flex-col items-center justify-center py-1 ${
            active === "profile" ? "text-primary" : "text-neutral-500 hover:text-primary"
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
}
