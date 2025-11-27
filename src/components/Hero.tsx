import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import LottieAnimation from "./LottieAnimation";
const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    // Check if mobile on mount and when window resizes
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  useEffect(() => {
    fetch('/loop-header.lottie').then(response => response.json()).then(data => setLottieData(data)).catch(error => console.error("Error loading Lottie animation:", error));
  }, []);
  useEffect(() => {
    // Skip effect on mobile
    if (isMobile) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !imageRef.current) return;
      const {
        left,
        top,
        width,
        height
      } = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      imageRef.current.style.transform = `perspective(1000px) rotateY(${x * 2.5}deg) rotateX(${-y * 2.5}deg) scale3d(1.02, 1.02, 1.02)`;
    };
    const handleMouseLeave = () => {
      if (!imageRef.current) return;
      imageRef.current.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isMobile]);
  useEffect(() => {
    // Skip parallax on mobile
    if (isMobile) return;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const elements = document.querySelectorAll('.parallax');
      elements.forEach(el => {
        const element = el as HTMLElement;
        const speed = parseFloat(element.dataset.speed || '0.1');
        const yPos = -scrollY * speed;
        element.style.setProperty('--parallax-y', `${yPos}px`);
      });
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  return <section className="overflow-hidden relative bg-white" id="hero" style={{
    padding: isMobile ? '100px 12px 40px' : '120px 20px 60px'
  }}>
      {/* Multi-layered radial gradients blending from white to brand green */}
      <div className="absolute -top-[15%] -right-[10%] w-[60%] h-[80%] rounded-full blur-3xl opacity-30" 
           style={{ background: 'radial-gradient(circle at center, rgba(230, 245, 241, 0.9) 0%, rgba(102, 195, 171, 0.4) 35%, rgba(11, 77, 58, 0.2) 70%, transparent 100%)' }}></div>
      <div className="absolute top-[20%] -right-[5%] w-[45%] h-[60%] rounded-full blur-3xl opacity-25" 
           style={{ background: 'radial-gradient(circle at center, rgba(204, 235, 227, 0.7) 0%, rgba(51, 175, 143, 0.3) 50%, transparent 100%)' }}></div>
      <div className="absolute top-[5%] right-[10%] w-[35%] h-[50%] rounded-full blur-2xl opacity-20" 
           style={{ background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.9) 0%, rgba(230, 245, 241, 0.5) 40%, rgba(153, 215, 199, 0.2) 70%, transparent 100%)' }}></div>
      
      <div className="container px-4 sm:px-6 lg:px-8" ref={containerRef}>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-center">
          <div className="w-full lg:w-1/2">
            
            
            <h1 className="section-title text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight opacity-0 animate-fade-in" style={{
            animationDelay: "0.3s"
          }}>Unlimited Golf
24/7 Access<br className="hidden sm:inline" />Meets Motion
            </h1>
            
            <p style={{
            animationDelay: "0.5s"
          }} className="section-subtitle mt-3 sm:mt-6 mb-4 sm:mb-8 leading-relaxed opacity-0 animate-fade-in text-gray-950 font-normal text-base sm:text-lg text-left">
              Experience golf on your schedule with our premium indoor simulator facility and monthly membership.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in" style={{
            animationDelay: "0.7s"
          }}>
              <a href="#get-access" className="flex items-center justify-center group w-full sm:w-auto text-center" style={{
              backgroundColor: '#0b4d3a',
              borderRadius: '1440px',
              boxSizing: 'border-box',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: '20px',
              padding: '16px 24px',
              // Slightly reduced padding for mobile
              border: '1px solid white'
            }}>
                Join the Waitlist            
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 relative mt-6 lg:mt-0">
            <div className="absolute inset-0 bg-dark-900 rounded-2xl sm:rounded-3xl -z-10 shadow-xl"></div>
            <div className="relative transition-all duration-500 ease-out overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl animate-fade-in" style={{
            animationDelay: "0.9s"
          }}>
              <img ref={imageRef} src="/golf-simulator.jpg" alt="Golf Simulator" className="w-full h-auto object-cover transition-transform duration-500 ease-out" style={{
              transformStyle: 'preserve-3d'
            }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom left gradient accent */}
      <div className="hidden lg:block absolute bottom-0 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 -z-10 parallax" data-speed="0.05"
           style={{ background: 'radial-gradient(circle at center, rgba(204, 235, 227, 0.8) 0%, rgba(102, 195, 171, 0.4) 40%, rgba(11, 77, 58, 0.1) 70%, transparent 100%)' }}></div>
      <div className="hidden lg:block absolute bottom-[10%] left-[15%] w-64 h-64 rounded-full blur-2xl opacity-15 -z-10"
           style={{ background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.7) 0%, rgba(230, 245, 241, 0.4) 50%, transparent 100%)' }}></div>
    </section>;
};
export default Hero;