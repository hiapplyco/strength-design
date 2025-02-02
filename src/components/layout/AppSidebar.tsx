import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger 
} from "@/components/ui/drawer";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailSignup } from "./navbar/EmailSignup";
import { SidebarLogo } from "./sidebar/SidebarLogo";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { useState } from "react";

export function AppSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[95vh]">
        <DrawerHeader className="p-4">
          <SidebarLogo />
          <div className="mt-4">
            <EmailSignup />
          </div>
        </DrawerHeader>
        <div className="px-4">
          <div className="text-sm font-medium text-muted-foreground">Navigation</div>
          <div className="mt-2">
            <SidebarNavigation />
          </div>
        </div>
      </DrawerContent>
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen w-64 flex-col border-r bg-background">
        <div className="p-4">
          <SidebarLogo />
          <div className="mt-4">
            <EmailSignup />
          </div>
        </div>
        <div className="flex-1 px-4">
          <div className="text-sm font-medium text-muted-foreground">Navigation</div>
          <div className="mt-2">
            <SidebarNavigation />
          </div>
        </div>
      </div>
    </Drawer>
  );
}