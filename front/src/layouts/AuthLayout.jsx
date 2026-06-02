import ThemeToggle from "../components/ThemeToggle";
import logoBlanco from "../assets/Barublanco.png";
import logoNegro from "../assets/barunegro.png";

function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center
      bg-gray-100 dark:bg-[#0B0F1A] transition-colors duration-300 overflow-x-hidden">

      {/* GLOW */}
      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2
        w-[700px] h-[350px]
        bg-gradient-to-b
        from-black/50
        via-black/35 to-transparent
        dark:from-white/40
        dark:via-white/25
        blur-3xl opacity-90 pointer-events-none">
      </div>

      {/* LOGO */}
      <div className="relative z-10 mt-6 mb-4">
        <img src={logoNegro}   alt="Baru Logo" className="w-36 block dark:hidden" />
        <img src={logoBlanco}  alt="Baru Logo" className="w-36 hidden dark:block" />
      </div>

      <ThemeToggle />

      {/* CONTENIDO */}
      <div className="relative z-10 w-full px-4 pb-8 flex justify-center">
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;