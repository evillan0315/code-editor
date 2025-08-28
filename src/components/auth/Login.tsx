// src/components/LoginForm.tsx

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; 
import Loading from '@/components/Loading';
import SignInWithGoogle from '@/components/SignInWithGoogle';
import SignInWithGithub from '@/components/SignInWithGithub';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { EDITOR_PATH } from '@/constants/paths'; 

const LoginForm: React.FC = () => {
  const { login } = useAuth(); 
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); 

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true); 

    try {
      await login({ email: email, password: password });

      

      navigate(EDITOR_PATH);
    } catch (err) {
      
      setError(
        (err as Error).message ||
          'Login failed. Please check your credentials.',
      );
    } finally {
      setLoading(false); 
    }
  };

  return (
    
    
    loading ? ( 
      <Loading /> 
    ) : (
      <div className="login-wrapper py-16">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-lg p-8 border shadow-lg">
            <div className="flex flex-col items-center text-center py-4">
              <Logo />
              <p className="text-sm mt-2">Please Sign In below</p>
            </div>

            {error && (
              <p className="text-center text-sm text-red-400">{error}</p>
            )}
            <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email-input" className="block">
                  Email
                </label>
                <input
                  id="email-input"
                  type="email"
                  placeholder="Enter email"
                  className="mt-1 w-full rounded-md border p-3 focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <label htmlFor="password-input" className="block">
                  Password
                </label>
                <input
                  id="password-input"
                  type="password"
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-md border p-3 focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  required
                />
              </div>
              <Button
                variant="primary"
                type="submit"
                size="lg"
                disabled={loading} 
                className="w-full rounded-md bg-sky-500 p-3 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            {}
            <SignInWithGoogle />
            <SignInWithGithub />
          </div>
        </div>
      </div>
    )
  );
};

export default LoginForm;
