import logoUrl from "@/assets/logo.jpg";

interface AppLogoProps {
  size?: number;
  className?: string;
  rounded?: string;
}

export default function AppLogo({ size = 64, className = "", rounded = "22%" }: AppLogoProps) {
  return (
    <img
      src={logoUrl}
      alt="شعار سِجِل"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}
