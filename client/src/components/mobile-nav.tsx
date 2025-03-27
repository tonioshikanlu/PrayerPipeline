import { useLocation } from "wouter";
import { Home, User, Search } from "lucide-react";

type MobileNavProps = {
  active: "home" | "explore" | "profile";
};

export default function MobileNav({ active }: MobileNavProps) {
  const [_, navigate] = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 py-2 md:hidden">
      <div className="grid grid-cols-3 gap-1">
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
            navigate("/explore");
          }}
          className={`flex flex-col items-center justify-center py-1 ${
            active === "explore" ? "text-primary" : "text-neutral-500 hover:text-primary"
          }`}
        >
          <Search className="h-6 w-6" />
          <span className="text-xs mt-1">Explore</span>
        </button>
        <button
          onClick={() => {
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
