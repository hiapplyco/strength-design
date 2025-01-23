import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ContactDialogProps {
  buttonText: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export const ContactDialog = ({ buttonText, variant = "default" }: ContactDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant}>{buttonText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form
          action="https://formspree.io/f/mwpvkakd"
          method="POST"
          className="w-full space-y-6"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                name="company"
                required
                className="bg-white/5 border-white/10"
                placeholder="Your affiliate or company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                name="name"
                required
                className="bg-white/5 border-white/10"
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberCount">Members Count</Label>
              <Select name="memberCount" required>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-50">0-50 members</SelectItem>
                  <SelectItem value="51-100">51-100 members</SelectItem>
                  <SelectItem value="101-200">101-200 members</SelectItem>
                  <SelectItem value="201+">201+ members</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="bg-white/5 border-white/10"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                className="bg-white/5 border-white/10"
                placeholder="(123) 456-7890"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" variant="destructive">
            {buttonText}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};