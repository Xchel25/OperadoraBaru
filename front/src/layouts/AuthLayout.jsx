import ThemeToggle from "../components/ThemeToggle";
import logoBlanco from "../assets/Barublanco.png";
import logoNegro from "../assets/barunegro.png";

function AuthLayout({ children }) {
  return (
    <div className="relative h-screen flex items-center justify-center 
      bg-gray-100 dark:bg-[#0B0F1A] transition-colors duration-300 overflow-hidden">

      {/* 🔥 GLOW (NO TOCAR, ya está bien) */}
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
      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10">
        <img
          src={logoNegro}
          alt="Baru Logo"
          className="w-40 block dark:hidden"
        />
        <img
          src={logoBlanco}
          alt="Baru Logo"
          className="w-40 hidden dark:block"
        />
      </div>

      <ThemeToggle />

      {/* CONTENIDO */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;