import { ContactDialog } from "@/components/landing/ContactDialog";

export const Footer = () => {
  return (
    <footer className="bg-black border-t border-primary/20 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-oswald text-primary mb-4">About Us</h3>
            <p className="text-white/80">
              Empowering trainers and athletes with AI-driven strength programming solutions.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-oswald text-primary mb-4">Contact</h3>
            <ContactDialog buttonText="Get in Touch" variant="link" className="text-white/80 hover:text-white" />
          </div>
          <div>
            <h3 className="text-xl font-oswald text-primary mb-4">Legal</h3>
            <div className="space-y-2">
              <a href="#" className="block text-white/80 hover:text-white">Terms of Service</a>
              <a href="#" className="block text-white/80 hover:text-white">Privacy Policy</a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-primary/20 text-center text-white/60">
          <p>&copy; {new Date().getFullYear()} strength.design. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};