import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ModulesSection from '@/components/ModulesSection';
import FeaturesSection from '@/components/FeaturesSection';
import ProductDemoSection from '@/components/ProductDemoSection';
import AboutSection from '@/components/AboutSection';
import PlansSection from '@/components/PlansSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';

const Home: React.FC = () => {
  return (
    <div className="font-sans text-darkText">
      <Header />
      <HeroSection />
      <ModulesSection />
      <FeaturesSection />
      <ProductDemoSection />
      <AboutSection />
      <PlansSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <FloatingWhatsApp />
      <Footer />
    </div>
  );
};

export default Home;
