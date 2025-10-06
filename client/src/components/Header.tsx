import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Loader2, LogOut, UserCircle } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [_, setLocation] = useLocation();
  const { currentUser, userLoading, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className={`bg-white ${isScrolled ? 'shadow-sm' : ''} fixed top-0 left-0 w-full z-50 transition-shadow`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <a href="#" className="flex items-center" onClick={() => scrollToSection('hero')}>
            <i className="fas fa-notes-medical text-primary mr-2 text-xl"></i>
            <span className="text-xl font-bold text-primary">Preskriptor</span>
          </a>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <button onClick={() => scrollToSection('features')} className="text-sm hover:text-primary transition-colors">
            Funcionalidades
          </button>
          <button onClick={() => scrollToSection('plans')} className="text-sm hover:text-primary transition-colors">
            Planos
          </button>
          <button onClick={() => scrollToSection('about')} className="text-sm hover:text-primary transition-colors">
            Segurança
          </button>
          <button onClick={() => scrollToSection('contact')} className="text-sm hover:text-primary transition-colors">
            Contato
          </button>
        </nav>
        
        <div className="flex items-center space-x-3">
          {userLoading ? (
            <Loader2 className="animate-spin text-primary h-5 w-5" />
          ) : currentUser ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-8 w-8 rounded-full">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || 'Perfil'}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <UserCircle className="h-7 w-7 text-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    if (currentUser?.verified) {
                      setLocation('/dashboard/consulta');
                    } else {
                      setLocation('/dashboard/verificacao');
                    }
                  }}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="hidden md:inline-block text-primary border-primary hover:bg-primary hover:text-white"
                onClick={() => setLocation('/auth')}
              >
                Login
              </Button>
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primaryDark"
                onClick={() => setLocation('/cadastro')}
              >Teste gratuitamente</Button>
            </>
          )}
          <button className="md:hidden text-primary" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      <div className={`md:hidden bg-white w-full border-t ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
          <button onClick={() => scrollToSection('features')} className="py-2 text-sm hover:text-primary transition-colors">
            Funcionalidades
          </button>
          <button onClick={() => scrollToSection('plans')} className="py-2 text-sm hover:text-primary transition-colors">
            Planos
          </button>
          <button onClick={() => scrollToSection('about')} className="py-2 text-sm hover:text-primary transition-colors">
            Segurança
          </button>
          <button onClick={() => scrollToSection('contact')} className="py-2 text-sm hover:text-primary transition-colors">
            Contato
          </button>
          
          {!currentUser && (
            <Button 
              variant="outline" 
              className="py-2 text-sm text-primary border-primary"
              onClick={() => setLocation('/auth')}
            >
              Login
            </Button>
          )}
          
          {currentUser && (
            <>
              <Button 
                variant="outline" 
                className="py-2 text-sm text-primary border-primary"
                onClick={() => {
                  if (currentUser?.verified) {
                    setLocation('/chat');
                  } else {
                    setLocation('/dashboard/verificacao');
                  }
                }}
              >
                Dashboard
              </Button>
              <Button 
                variant="destructive" 
                className="py-2 text-sm"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
