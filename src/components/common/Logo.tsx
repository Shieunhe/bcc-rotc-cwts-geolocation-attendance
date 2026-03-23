interface LogoProps {
  className?: string;
  alt?: string;
}

export default function Logo({
  className = "w-10 h-10 object-contain",
  alt = "Buenavista Community College Logo",
}: LogoProps) {
  return (
    <img
      src="/image/feb5dc39-69af-4d8a-a3d7-66aca9aaa290.png"
      alt={alt}
      className={className}
    />
  );
}
