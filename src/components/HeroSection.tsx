import { ReactNode } from "react";

const HeroSection = ({ children }: { children: ReactNode }) => {
  return (
    <section className="relative py-6 px-4 circuit-lines">
      <div className="absolute inset-0 z-0 circuit-pattern" />
      <div className="relative z-10 max-w-3xl mx-auto">
        {children}
      </div>
    </section>
  );
};

export default HeroSection;
