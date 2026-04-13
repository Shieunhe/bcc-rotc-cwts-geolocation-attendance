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
      src="/image/bcclogo-removebg-preview.png"
      alt={alt}
      className={className}
    />
  );
}
