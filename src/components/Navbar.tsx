import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Prevent background scrolling when menu is open
    document.body.style.overflow = !isMenuOpen ? 'hidden' : '';
  };
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Close mobile menu if open
    if (isMenuOpen) {
      setIsMenuOpen(false);
      document.body.style.overflow = '';
    }
  };
  return <header className={cn("fixed top-0 left-0 right-0 z-50 py-2 sm:py-3 md:py-4 transition-all duration-300", isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent")}>
      <div className="container flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center space-x-2" onClick={e => {
        e.preventDefault();
        scrollToTop();
      }} aria-label="Diversey Golf">
          <img src="/diversey-golf-logo.png" alt="Diversey Golf Logo" className="h-20 sm:h-24" />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <a href="#details" className="px-4 py-2 rounded-full font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200" style={{border: '1px solid #0b4d3a'}}>FAQs</a>
          <a href="#details" className="px-4 py-2 rounded-full font-medium text-white" style={{backgroundColor: '#0b4d3a'}}>Join the Waitlist</a>
        </nav>

        {/* Mobile menu button - increased touch target */}
        <button className="md:hidden text-gray-700 p-3 focus:outline-none" onClick={toggleMenu} aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation - improved for better touch experience */}
      <div className={cn("fixed inset-0 z-40 bg-white flex flex-col pt-16 px-6 md:hidden transition-all duration-300 ease-in-out", isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none")}> 
        <nav className="flex flex-col space-y-8 items-center mt-8">
          <a href="#details" className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100" onClick={() => {
            setIsMenuOpen(false);
            document.body.style.overflow = '';
          }}>
            FAQs
          </a>
          <a href="#details" className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100" style={{backgroundColor: '#0b4d3a', color: '#fff'}} onClick={() => {
            setIsMenuOpen(false);
            document.body.style.overflow = '';
          }}>
            Join the Waitlist
          </a>
        </nav>
      </div>
    </header>;
};
export default Navbar;