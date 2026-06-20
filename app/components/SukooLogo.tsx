import Image from "next/image";

type SukooLogoProps = {
  className?: string;
  light?: boolean;
  priority?: boolean;
};

export default function SukooLogo({
  className = "",
  light = false,
  priority = false,
}: SukooLogoProps) {
  return (
    <Image
      src="/sukoo-logo.png"
      alt="Sukoo Coffee"
      width={259}
      height={92}
      priority={priority}
      className={`h-auto object-contain ${
        light ? "brightness-0 invert" : ""
      } ${className}`}
    />
  );
}
