import { Link } from "react-router-dom";
import { Home, FileText, Dumbbell, Video, DollarSign, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./navbar/MobileMenu";

export const Navbar = () => {
  const navItems = [
    { path: '/workout-generator', icon: <Dumbbell className="h-5 w-5" />, text: 'Generate Program' },
    { path: '/generated-workouts', icon: <FileText className="h-5 w-5" />, text: 'Previous Programs' },
    { path: '/video-analysis', icon: <Video className="h-5 w-5" />, text: 'Publish Program' },
    { path: '/program-chat', icon: <MessageSquare className="h-5 w-5" />, text: 'Program Chat' },
    { path: '/pricing', icon: <DollarSign className="h-5 w-5" />, text: 'Upgrade to Pro' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-8">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-accent hover:text-accent/80 transition-colors"
            >
              <Link to="/" aria-label="Home">
                <Home className="h-6 w-6" />
              </Link>
            </Button>
            <h1 className="text-2xl font-collegiate text-accent tracking-wider">
              <Link to="/" className="hover:text-accent/80 transition-colors">
                STRENGTH.DESIGN
              </Link>
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Button 
                key={item.path}
                asChild 
                variant="ghost" 
                className="text-accent hover:text-accent/80 transition-colors flex items-center gap-2"
              >
                <Link to={item.path}>
                  {item.icon}
                  <span>{item.text}</span>
                </Link>
              </Button>
            ))}
          </div>

          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
};