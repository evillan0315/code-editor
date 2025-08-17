// src/components/SignInWithGoogle.tsx

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react"; // Changed to React version
import { Button } from "@/components/ui/Button"; // Assuming this is a React component
import { useAuth } from "@/hooks/useAuth"; // Assuming you want to integrate with your AuthContext on success
import { useNavigate } from "react-router-dom"; // For navigation after success

// Environment variable setup (adjust based on your build tool, e.g., Vite or Create React App)
// If using Vite:
const GOOGLE_AUTH_URL = import.meta.env.VITE_GOOGLE_CALLBACK_URL; // Renamed for clarity and common Vite pattern
// If using Create React App:
// const GOOGLE_AUTH_URL = process.env.REACT_APP_GOOGLE_CALLBACK_URL;

/**
 * Represents the payload returned after a successful sign-in with Google.
 * This structure assumes your backend redirects with these parameters.
 */
interface SignInSuccessCallbackPayload {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role?: string;
  };
}

/**
 * Defines the properties for the `SignInWithGoogle` component.
 */
interface SignInWithGoogleProps {
  /**
   * Optional: A callback function to be executed upon successful sign-in with Google.
   * It receives a `SignInSuccessCallbackPayload` object.
   * Note: For full auth integration, it's often better to update AuthContext directly here
   * rather than relying solely on this prop if your AuthProvider manages state.
   */
  onLoginSuccess?: (payload: SignInSuccessCallbackPayload) => void;
  /**
   * A callback function to be executed when an error occurs during the sign-in process.
   * It receives an `Error` object.
   */
  onLoginError?: (error: Error) => void;
}

/**
 * A component that provides a button to initiate sign-in with Google.
 * This component handles the initiation of the Google OAuth flow via a backend endpoint
 * and also processes the callback from the backend after successful authentication.
 *
 * @param props - The properties for the component, including optional success and error callbacks.
 * @returns A JSX element representing the sign-in with Google button.
 */
const SignInWithGoogle: React.FC<SignInWithGoogleProps> = ({
  onLoginSuccess,
  onLoginError,
}) => {
  const { refetchUser } = useAuth(); // To refresh user state in AuthContext after login
  const navigate = useNavigate(); // To navigate after successful login

  // State to hold the URL to initiate the Google OAuth flow on the backend.
  const [loginUrl, setLoginUrl] = useState<string>("");

  useEffect(() => {
    // Set the login URL when the component mounts.
    if (GOOGLE_AUTH_URL) {
      setLoginUrl(GOOGLE_AUTH_URL);
    } else {
      console.warn(
        "VITE_GOOGLE_CALLBACK_URL (or equivalent) is not configured. Google login will not work.",
      );
    }

    // This part handles the callback *from your backend* after successful Google login.
    // It runs only once when the component mounts to check for URL parameters.
    const handleGoogleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("accessToken"); // Assuming your backend sends 'accessToken'
      const userId = params.get("userId");
      const userEmail = params.get("userEmail");
      const userName = params.get("userName");
      const userRole = params.get("userRole");
      const userImage = params.get("userImage");
      const errorParam = params.get("error");
      const errorDescription = params.get("error_description");

      // Check if we have successful login parameters
      if (token && userId && userEmail) {
        const user: SignInSuccessCallbackPayload["user"] = {
          id: userId,
          email: userEmail,
          name: userName || undefined,
          image: userImage || undefined,
          role: userRole || undefined,
        };
        const payload: SignInSuccessCallbackPayload = {
          accessToken: token,
          user: user,
        };

        // Save to localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Call the provided success callback if it exists
        onLoginSuccess?.(payload);

        // Crucially, refetch the user and update global AuthContext state
        // This makes sure your `useAuth` hook gets the latest user info.
        refetchUser();

        // Remove the query parameters from the URL history
        // This prevents re-processing the same token on refresh or subsequent mounts.
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );

        // Optionally navigate away after successful login if this component
        // is not on the dashboard page itself.
        // If this component is *only* on the login page and you want to go to dashboard, uncomment:
        navigate("/dashboard");

        // Note: The original SolidJS code did window.location.reload().
        // In React SPAs, it's generally preferred to update state and navigate
        // without a full reload for a smoother UX. If a reload is absolutely
        // necessary for your backend/session logic, you can add it back:
        // window.location.reload();
      } else if (errorParam) {
        // Handle error callback parameters
        const errorMessage = errorDescription || "Google login failed.";
        onLoginError?.(new Error(errorMessage));
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    };

    // Execute the callback handler only on mount
    handleGoogleCallback();
  }, [onLoginSuccess, onLoginError, refetchUser, navigate]); // Dependencies for useEffect

  /**
   * Initiates the Google login flow by redirecting the user to the backend's authentication URL.
   */
  const initiateLogin = () => {
    if (loginUrl) {
      window.location.href = loginUrl;
    } else {
      console.error("Google auth URL is not configured (GOOGLE_AUTH_URL).");
      onLoginError?.(new Error("Google authentication URL is not set."));
    }
  };

  return (
    <Button
      onClick={initiateLogin}
      // Note: `class` becomes `className` in React JSX
      className="w-full flex items-center gap-2 justify-center p-3 text-white bg-neutral-900 rounded-md hover:bg-neutral-800 mt-4"
    >
      <Icon icon="flat-color-icons:google" width="20" height="20" /> Sign in
      with Google
    </Button>
  );
};

export default SignInWithGoogle;
