import Link from "next/link";

export const Button = ({ children, variant = "primary", className = "", href, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300";
  
  const variants = {
    primary: "bg-[#1a1615] text-white hover:bg-[#332b29] px-6 py-2 text-sm md:text-base shadow-lg",
    secondary: "bg-black/5 text-black hover:bg-black/10 px-6 py-2 text-sm md:text-base",
    outline: "border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 px-6 py-3 text-sm md:text-base",
    accent: "bg-[#E6FA05] text-black hover:bg-[#d4e604] px-8 py-4 text-lg shadow-lg", // For the big CTA
  };

  const Component = href ? Link : "button";
  
  return (
    <Component 
      href={href}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
