import { Link } from "react-router-dom";

export function HeaderSection() {
  return (
    <div className="absolute top-4 right-0 pr-4 max-w-md text-right">
      <Link to="/best-app-of-day" className="text-primary hover:underline font-bold inline-flex items-center">
        Check out our CrossFit focused builder→
      </Link>
      <p className="text-sm text-muted-foreground mt-2">
        CrossFit's unique blend of complex movements and intense metrics inspired our journey, shaping how we approach progression in all domains.
      </p>
    </div>
  );
}