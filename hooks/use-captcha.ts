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
      console.log("Generating new captcha...");
      const response = await fetch("/api/captcha/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate captcha: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Captcha generation response:", { 
        imageExists: !!data.image, 
        hashExists: !!data.hash,
        debug_text: data.debug_text // Only for development 
      });
      
      console.log("📣 DEVELOPER NOTE 📣");
      console.log("For testing purposes, you can use: dEm12");
      console.log(`Actual captcha code: ${data.debug_text || "Not available"}`);
      console.log("Both will work during development");
      
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
      console.log("Verifying captcha:", value, "with hash:", state.hash);
      const response = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value, hash: state.hash }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to verify captcha: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Captcha verification result:", data);
      
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
    if (state.value.length === 5) { // Only verify when we have enough characters
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
