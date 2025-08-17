// src/components/ui/Icon.tsx
import React, { useEffect, useState } from "react";
import type { HTMLAttributes } from "react";
import { getIconNameSvg } from "@/services/icon";

interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  icon: string;
  size?: number | string;
  width?: number | string;
  height?: number | string;
}

export const Icon: React.FC<IconProps> = ({
  icon,
  size = "1em",
  width,
  height,
  className = "",
  ...rest
}) => {
  const [svg, setSvg] = useState<string | null>(null);

  const resolvedWidth =
    width ?? (typeof size === "number" ? `${size}px` : (size ?? "1.2em"));

  const resolvedHeight =
    height ?? (typeof size === "number" ? `${size}px` : (size ?? "1.2em"));

  useEffect(() => {
    let cancelled = false;

    getIconNameSvg(icon).then((svgContent) => {
      if (!cancelled) setSvg(svgContent);
    });

    return () => {
      cancelled = true;
    };
  }, [icon]);

  return svg ? (
    <span
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ width: resolvedWidth, height: resolvedHeight }}
      className={`inline-block align-middle ${className}`}
      {...rest}
    />
  ) : (
    <div
      className={`inline-block animate-pulse text-gray-300 ${className}`}
      style={{ width: resolvedWidth, height: resolvedHeight }}
      {...rest}
    >
      ⬤
    </div>
  );
};
