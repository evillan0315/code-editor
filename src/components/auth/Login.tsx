// src/components/LoginForm.tsx

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Ensure this imports your Nanostore-based useAuth hook
import Loading from '@/components/Loading';
import SignInWithGoogle from '@/components/SignInWithGoogle';
import SignInWithGithub from '@/components/SignInWithGithub';
import { Button } from '@/components/ui/Button';
import  Logo  from '@/components/ui/Logo';
import { EDITOR_PATH } from '@/constants/paths'; // Import your dashboard path

const LoginForm: React.FC = () => {
  const { login } = useAuth(); // Accessing the login function from your Nanostore auth system
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // This `loading` is for the form submission itself

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true); // Start local form loading indicator

    try {
      await login({ email: email, password: password });

      // If login succeeds, navigate to the dashboard (or your primary authenticated route)

      navigate(EDITOR_PATH);
    } catch (err) {
      // Catch any errors during login and display them
      setError(
        (err as Error).message ||
          'Login failed. Please check your credentials.',
      );
    } finally {
      setLoading(false); // End local form loading indicator
    }
  };

  return (
    // You might combine this `loading` with `useAuth().isLoading` if `Loading` is a full page loader
    // For now, it correctly indicates the form submission loading state.
    loading ? ( // This `loading` state is specifically for the form submission
      <Loading /> // This `Loading` component might be a spinner or a div that covers the form
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
                disabled={loading} // Disable button while login is in progress
                className="w-full rounded-md bg-sky-500 p-3 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            {/* Social sign-in components */}
            <SignInWithGoogle />
            <SignInWithGithub />
          </div>
        </div>
      </div>
    )
  );
};

export default LoginForm;
