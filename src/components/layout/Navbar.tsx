import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  return (
    <nav className="w-full bg-black border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
            >
              <Link to="/">
                <Home className="h-6 w-6 text-primary" />
              </Link>
            </Button>
            <span className="text-2xl font-collegiate text-primary tracking-wider">
              STRENGTH.DESIGN
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};