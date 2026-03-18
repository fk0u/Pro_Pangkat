import { useState, useEffect, useCallback } from "react";

export interface CaptchaState {
  image: string | null;
  hash: string | null;
  loading: boolean;
  error: string | null;
  value: string;
  isValid: boolean;
  isValidating: boolean;
}

export const useCaptcha = () => {
  const [state, setState] = useState<CaptchaState>({
    image: null,
    hash: null,
    loading: true,
    error: null,
    value: "",
    isValid: false,
    isValidating: false,
  });

  // Generate a new captcha
  const generateCaptcha = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch("/api/captcha/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate captcha: ${response.status}`);
      }
      
      const data = await response.json();
      
      setState((prev) => ({
        ...prev,
        image: data.image,
        hash: data.hash,
        loading: false,
        value: "",
        isValid: false,
      }));
    } catch (error) {
      console.error("Captcha generation error:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to generate captcha",
      }));
    }
  }, []);

  // Verify the captcha input
  const verifyCaptcha = useCallback(async (value: string) => {
    if (!state.hash || !value) {
      setState((prev) => ({ ...prev, isValid: false }));
      return false;
    }
    
    setState((prev) => ({ ...prev, isValidating: true }));
    
    try {
      const response = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value, challengeToken: state.hash }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to verify captcha: ${response.status}`);
      }
      
      const data = await response.json();
      
      setState((prev) => ({
        ...prev,
        isValid: data.valid,
        isValidating: false,
      }));
      
      return data.valid;
    } catch (error) {
      console.error("Captcha verification error:", error);
      setState((prev) => ({
        ...prev,
        isValid: false,
        isValidating: false,
        error: error instanceof Error ? error.message : "Failed to verify captcha",
      }));
      return false;
    }
  }, [state.hash]);

  // Update captcha input value - make it uppercase to match the captcha
  const updateValue = useCallback((value: string) => {
    setState((prev) => ({ ...prev, value: value.toUpperCase() }));
  }, []);

  // Generate captcha on mount
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // Verify captcha when value changes
  useEffect(() => {
    if (state.value.length === 5) {
      verifyCaptcha(state.value);
    } else if (state.value.length < 5) {
      setState(prev => ({ ...prev, isValid: false }));
    }
  }, [state.value, verifyCaptcha]);

  return {
    image: state.image,
    hash: state.hash,
    loading: state.loading,
    error: state.error,
    value: state.value,
    isValid: state.isValid,
    isValidating: state.isValidating,
    generateCaptcha,
    updateValue,
  };
};
