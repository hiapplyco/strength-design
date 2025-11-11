
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScheduleWorkoutModal } from "./ScheduleWorkoutModal";

// Floating Action Button to trigger workout scheduling modal
export const ScheduleAddWorkoutButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed z-50 bottom-8 right-8 rounded-full shadow-2xl bg-primary text-primary-foreground w-16 h-16 flex items-center justify-center text-3xl hover:bg-primary/80 transition-all"
        style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,.16)" }}
        aria-label="Add workout"
      >
        <Plus className="h-8 w-8" />
      </Button>
      <ScheduleWorkoutModal open={open} onOpenChange={setOpen} />
    </>
  );
};
