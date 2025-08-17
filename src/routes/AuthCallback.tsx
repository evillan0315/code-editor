import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { handleOAuthCallback } from '@/stores/authStore';
import { EDITOR_PATH } from '@/constants/paths';
import type { User } from '@/types/auth';
import Loading from '@/components/Loading'; // Assuming a Loading component exists

const AuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');

    if (accessToken) {
      const userData: User = {
        sub: params.get('userId') || undefined,
        email: params.get('userEmail') || undefined,
        name: params.get('userName') || undefined,
        image: params.get('userImage') || undefined,
        role: params.get('userRole') || undefined,
        username: params.get('username') || undefined,
        provider: params.get('provider') || undefined,
      };

      try {
        handleOAuthCallback({ token: accessToken, user: userData });
        navigate(EDITOR_PATH, { replace: true });
      } catch (error) {
        console.error('Failed to process auth callback:', error);
        // Optionally redirect to login with an error message
        navigate('/login?error=auth_failed', { replace: true });
      }
    } else {
      console.error('AuthCallback: No access token found in URL.');
      navigate('/login?error=no_token', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-900 text-white'>
      <Loading />
      <p className='ml-4 text-lg'>Processing authentication...</p>
    </div>
  );
};

export default AuthCallback;
