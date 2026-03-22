export default function Footer() {
  return (
    <p className="text-center text-xs text-gray-400 mt-6" suppressHydrationWarning>
      Buenavista Community College &copy; {new Date().getFullYear()}
    </p>
  );
}
