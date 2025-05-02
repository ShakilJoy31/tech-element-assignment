import React from "react";

// Define the props interface
interface CustomButtonProps {
  children: React.ReactNode; // Content inside the button
  type?: "button" | "submit" | "reset"; // Button type
  onClick?: () => void; // Click handler
  className?: string; // Additional CSS classes
  disabled?: boolean; // Disabled state
}

// Define the Button component
const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  type = "button",
  onClick,
  className = "",
  disabled = false,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 font-medium rounded-md dark:bg-white focus:outline-none transition-opacity duration-200 ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 active:opacity-45"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default CustomButton;