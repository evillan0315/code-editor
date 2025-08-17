import React from "react";
import { Icon } from "@/components/ui/Icon";
interface LogoProps {
  color?: string;
  size?: string;
}

const Logo: React.FC<LogoProps> = ({
  secondary = "text-gray-200",
  color = "text-sky-500",
  size = "text-lg",
}) => {
  return (
    <div className={`flex items-center font-light text-lg`}>
      <Icon icon="mdi:json" width="1.6em" height="1.6em" />
      <span className={`uppercase font-semibold text-primary pl-2`}>Code</span>
      <span className={`italic text-base space-x-6`}>Gen</span>
    </div>
  );
};

export default Logo;
