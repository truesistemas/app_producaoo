import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Factory, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
    showPassword: false,
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'operator',
    showPassword: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await login(loginForm.username, loginForm.password);
      setLocation('/');
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const result = await register({
        username: registerForm.username,
        password: registerForm.password,
        name: registerForm.name,
        role: registerForm.role,
      });
      
      // Only redirect to dashboard if user was approved and logged in
      // If user needs approval, they'll stay on login page
      if (!result?.requiresApproval) {
        setLocation('/');
      } else {
        // Reset form and switch back to login tab
        setRegisterForm({
          name: '',
          username: '',
          password: '',
          role: 'operator',
          showPassword: false,
        });
        // Switch to login tab
        const loginTab = document.querySelector('[value="login"]') as HTMLElement;
        if (loginTab) {
          loginTab.click();
        }
      }
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and title */}
        <div className="flex items-center justify-center mb-8">
          <Factory className="text-primary text-4xl mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ControleProd</h1>
            <p className="text-sm text-gray-600">Sistema de Controle de Produção</p>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-gray-900">
              Acesso ao Sistema
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-username">Nome de usuário</Label>
                    <Input
                      id="login-username"
                      type="text"
                      value={loginForm.username}
                      onChange={(e) =>
                        setLoginForm(prev => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="Digite seu usuário"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative mt-1">
                      <Input
                        id="login-password"
                        type={loginForm.showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm(prev => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Digite sua senha"
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setLoginForm(prev => ({ ...prev, showPassword: !prev.showPassword }))
                        }
                      >
                        {loginForm.showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Entrando...
                      </div>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Entrar
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="register-name">Nome completo</Label>
                    <Input
                      id="register-name"
                      type="text"
                      value={registerForm.name}
                      onChange={(e) =>
                        setRegisterForm(prev => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Digite seu nome completo"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-username">Nome de usuário</Label>
                    <Input
                      id="register-username"
                      type="text"
                      value={registerForm.username}
                      onChange={(e) =>
                        setRegisterForm(prev => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="Escolha um nome de usuário"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative mt-1">
                      <Input
                        id="register-password"
                        type={registerForm.showPassword ? 'text' : 'password'}
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm(prev => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Crie uma senha segura"
                        required
                        className="pr-10"
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setRegisterForm(prev => ({ ...prev, showPassword: !prev.showPassword }))
                        }
                      >
                        {registerForm.showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-role">Nível de acesso</Label>
                    <Select
                      value={registerForm.role}
                      onValueChange={(value) =>
                        setRegisterForm(prev => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o nível de acesso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operator">Operador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Criando conta...
                      </div>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Criar conta
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Sistema de controle de produção para máquinas injetoras
          </p>
          <p className="text-xs text-gray-500 mt-1">
            © 2024 ControleProd - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
} 