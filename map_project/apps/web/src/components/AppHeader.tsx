"use client";
import ssgiLogo from "@/assets/ssgi-logo.png";
import SearchBar from "./SearchBar";
import UserViewSelector from "./UserViewSelector";
import { Menu } from "lucide-react";

interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export default function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  return (
    <header className="h-14 navy-gradient flex items-center justify-between px-4 border-b border-navy-light z-[1100] relative">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="text-primary-foreground hover:text-gold transition-colors lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <img src={ssgiLogo.src} alt="SSGI Logo" className="h-9 w-9 object-contain" />
        <div className="hidden sm:block">
          <h1 className="text-sm font-display font-bold text-primary-foreground leading-tight">Ethio-Map Platform</h1>
          <p className="text-[10px] text-gold-light tracking-wide">National Geoportal — From Earth to Space</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <SearchBar />
        </div>
        <UserViewSelector />
      </div>
    </header>
  );
}
