
import { Link } from "react-router-dom";
import { StyledLogo } from "@/components/ui/styled-logo";

export const Logo = () => {
  return (
    <Link to="/" className="hover:opacity-80 transition-opacity">
      <StyledLogo size="medium" />
    </Link>
  );
};
