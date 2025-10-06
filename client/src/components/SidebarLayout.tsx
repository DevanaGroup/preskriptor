import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLocation } from 'wouter';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Zap,
  MessageCircle,
  Clock,
  User,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  getUserConversations,
  getAllUserConversations,
  type Conversation
} from '@/lib/firebase';

interface SidebarLayoutProps {
  children: React.ReactNode;
  onNewConversation?: () => void;
}


const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children, onNewConversation }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();
  const { getRemainingCredits, getSubscriptionPlan } = useSubscriptionAccess();
  
  // Estados para conversas
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Verificar se estamos na página de verificação
  const isVerificationPage = location === '/dashboard/verificacao';
  

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // Carregar histórico de conversas
  const loadConversations = async (showAll: boolean = false) => {
    if (!currentUser) return;
    
    setLoadingHistory(true);
    try {
      const userConversations = showAll 
        ? await getAllUserConversations(currentUser.uid)
        : await getUserConversations(currentUser.uid, 5);
      
      setConversations(userConversations);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogoClick = () => {
    // Redirecionar direto para consulta
    navigate('/dashboard/consulta');
  };

  const handleNewChat = () => {
    // Sempre navegar para consulta
    navigate('/dashboard/consulta');
    if (onNewConversation) {
      onNewConversation();
    }
  };

  const handleHistoryClick = () => {
    setShowAllHistory(!showAllHistory);
    loadConversations(!showAllHistory);
  };

  const handleConversationClick = (conversation: Conversation) => {
    // Navegar para o histórico com o ID da conversa
    if (conversation.id) {
      navigate(`/history?session=${conversation.id}`);
    } else if (conversation.conversationHash) {
      // Fallback para hash se não tiver ID
      navigate(`/history?session=${conversation.conversationHash}`);
    } else {
      // Fallback final
      navigate('/dashboard/consulta');
    }
  };

  // Carregar conversas iniciais quando usuário loga
  useEffect(() => {
    if (currentUser) {
      loadConversations(false);
    }
  }, [currentUser]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <motion.div 
        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-sm"
        animate={{ width: isCollapsed ? 80 : 320 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Header do Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleLogoClick}
            className="w-full hover:opacity-80 transition-opacity"
          >
            {isCollapsed ? (
              <div className="flex justify-center">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-notes-medical text-white"></i>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-notes-medical text-white"></i>
                </div>
                <div className="text-left">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Preskriptor</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Consultas Inteligentes</p>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* 1. Novo Chat */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className="w-full justify-start h-10 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={handleNewChat}
          >
            <MessageCircle className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-3"
                >
                  Novo Chat
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* 2. Histórico */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start h-10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleHistoryClick}
            >
              <Clock className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="ml-3"
                  >
                    Histórico
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
          
          {/* Lista de conversas */}
          {!isCollapsed && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-2 pb-4"
              >
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Carregando...</div>
                  </div>
                ) : conversations.length > 0 ? (
                  <>
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => handleConversationClick(conversation)}
                        className="w-full text-left px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md mb-1 truncate"
                        title={conversation.title}
                      >
                        {conversation.title}
                      </button>
                    ))}
                    
                    {!showAllHistory && (
                      <button
                        onClick={() => navigate('/history')}
                        className="w-full text-center px-3 py-2 text-xs text-primary dark:text-blue-400 hover:underline"
                      >
                        Ver todo o histórico
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-2">
                    <div className="text-xs text-gray-400 dark:text-gray-500">Nenhuma conversa ainda</div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Espaçador flexível */}
        <div className="flex-1"></div>

        {/* Indicador de Créditos e Plano */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {isCollapsed ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {getRemainingCredits()}
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Zap className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getRemainingCredits()} créditos
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          Plano {getSubscriptionPlan()}
                        </p>
                      </div>
                    </div>
                    {getSubscriptionPlan() === 'freemium' && !isVerificationPage && (
                      <Button 
                        size="sm" 
                        className="text-xs h-6 px-2"
                        onClick={() => navigate('/dashboard/planos')}
                      >
                        Upgrade
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Botão de Curso */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {isCollapsed ? (
            <Button
              className="w-full justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 border-0"
              onClick={() => window.open('https://pay.hotmart.com/O91361358R?bid=1749910928081', '_blank')}
            >
              <GraduationCap className="w-5 h-5" />
            </Button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="w-8 h-8" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">Acesse a formação completa</h4>
                      <p className="text-xs opacity-90">e domine todos os módulos</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-3 bg-white text-blue-600 hover:bg-gray-100"
                    size="sm"
                    onClick={() => window.open('https://pay.hotmart.com/O91361358R?bid=1749910928081', '_blank')}
                  >
                    Adquirir Agora
                  </Button>
                </Card>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* 5. Alternar Tema */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className="w-full justify-start h-10 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Sun className="w-5 h-5 flex-shrink-0" />
            )}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-3"
                >
                  {theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* 6. Avatar com Dropdown Menu */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isCollapsed ? (
                <button className="w-full flex justify-center focus:outline-none">
                  <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all">
                    <AvatarImage src={currentUser?.photoURL || undefined} />
                    <AvatarFallback>
                      {(currentUser?.displayName || currentUser?.name)?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              ) : (
                <button className="w-full flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors focus:outline-none">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={currentUser?.photoURL || undefined} />
                    <AvatarFallback>
                      {(currentUser?.displayName || currentUser?.name)?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {currentUser?.displayName || currentUser?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                </button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align={isCollapsed ? "center" : "start"}>
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/dashboard/perfil')}>
                <User className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Botão de Colapsar */}
      <div className="flex flex-col justify-start pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;