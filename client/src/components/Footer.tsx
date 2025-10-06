import React from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';

const Footer: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { currentUser, firestoreUser } = useAuth();
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer className="bg-white border-t pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <a href="#" className="flex items-center mb-4" onClick={() => scrollToSection('hero')}>
              <i className="fas fa-notes-medical text-primary mr-2 text-xl"></i>
              <span className="text-xl font-bold text-primary">Preskriptor</span>
            </a>
            <p className="text-gray-600 text-sm">Apoiando a decisão médica com Inteligência Artificial</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Links rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-primary">
                  Funcionalidades
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('plans')} className="text-gray-600 hover:text-primary">
                  Planos
                </button>
              </li>
              
              <li>
                <button onClick={() => scrollToSection('contact')} className="text-gray-600 hover:text-primary">
                  Fale conosco
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms-of-service" className="text-gray-600 hover:text-primary">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-600 hover:text-primary">
                  Política de privacidade
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-600 hover:text-primary">
                  LGPD
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => setLocation('/admin')} 
                  className="text-gray-600 hover:text-primary flex items-center mt-3"
                >
                  <i className="fas fa-lock mr-1 text-xs"></i>
                  Painel Administrativo
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Redes sociais</h4>
            <div className="flex space-x-4">
              <a href="https://instagram.com/drnoe.nutrologo" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="https://br.linkedin.com/in/drnoealvarenga/pt" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                <i className="fab fa-linkedin text-xl"></i>
              </a>
              <a href="https://www.facebook.com/drnoealvarenga" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="https://www.youtube.com/@DrNoeNutrologo" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                <i className="fab fa-youtube text-xl"></i>
              </a>
              <a href="https://www.tiktok.com/@drnoe.nutrologo" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                <i className="fab fa-tiktok text-xl"></i>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <p className="text-center text-sm text-gray-500">
            © 2025 Preskriptor – Todos os direitos reservados
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
