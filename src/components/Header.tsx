const Header = () => (
  <header className="w-full bg-primary py-3 px-4 md:px-6 flex items-center gap-3">
    <span className="text-xl font-bold text-primary-foreground hidden md:inline">[&gt;]</span>
    <h1 className="text-base md:text-xl font-bold text-primary-foreground truncate">
      <span className="md:hidden">Game Fix Pro</span>
      <span className="hidden md:inline">GAME FIX PRO - Sistema de Reparación de Consolas</span>
    </h1>
  </header>
);

export default Header;
