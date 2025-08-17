// src/components/SignInWithGithub.tsx

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react"; // Changed to React version
import { Button } from "@/components/ui/Button"; // Assuming this is a React component

// Environment variable setup (adjust based on your build tool)
// If using Vite:
const GITHUB_AUTH_URL = import.meta.env.VITE_GITHUB_CALLBACK_URL; // Renamed for clarity and common Vite pattern
// If using Create React App:
// const GITHUB_AUTH_URL = process.env.REACT_APP_GITHUB_CALLBACK_URL;

/**
 * Defines the properties for the `SignInWithGithub` component.
 */
interface SignInWithGithubProps {
  // Add any props you might need for Github login, e.g., success/error callbacks
  // similar to SignInWithGoogle, if your backend also uses this pattern.
  // For simplicity, I'm keeping it minimal like the original SolidJS version.
}

/**
 * A component that provides a button to initiate sign-in with GitHub.
 * This component assumes `GITHUB_AUTH_URL` points directly to your backend's
 * endpoint that initiates the GitHub OAuth flow.
 *
 * @param props - The properties for the component (currently none).
 * @returns A JSX element representing the sign-in with GitHub button.
 */
const SignInWithGithub: React.FC<SignInWithGithubProps> = () => {
  // State to hold the URL to initiate the GitHub OAuth flow on the backend.
  const [loginUrl, setLoginUrl] = useState<string>("");

  useEffect(() => {
    // Set the login URL when the component mounts.
    if (GITHUB_AUTH_URL) {
      setLoginUrl(GITHUB_AUTH_URL);
    } else {
      console.warn(
        "VITE_GITHUB_CALLBACK_URL (or equivalent) is not configured. GitHub login will not work.",
      );
    }
  }, []); // Empty dependency array means this runs once on mount, like Solid's onMount

  /**
   * Initiates the GitHub login flow by redirecting the user to the backend's authentication URL.
   */
  const initiateLogin = () => {
    if (loginUrl) {
      window.location.href = loginUrl;
    } else {
      console.error("GitHub auth URL is not configured (GITHUB_AUTH_URL).");
      // Optionally, you could add an onLoginError prop and call it here.
    }
  };

  return (
    <Button
      onClick={initiateLogin}
      // Note: `class` becomes `className` in React JSX
      className="w-full flex gap-2 items-center justify-center p-3 text-white bg-gray-700 rounded-md hover:bg-gray-600 mt-4"
    >
      {/* Icon component from @iconify-icon/react */}
      <Icon
        icon="mdi:github"
        width="24"
        className="text-gray-900"
        height="24"
      />{" "}
      Sign in with Github
    </Button>
  );
};

export default SignInWithGithub;
