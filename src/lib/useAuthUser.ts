"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { getFirebase, isFirebaseConfigured } from "./firebase";

type AuthState = {
  loading: boolean;
  user: User | null;
  error: string;
};

export function useAuthUser(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    user: null,
    error: ""
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setState({
        loading: false,
        user: null,
        error: "Add Firebase values to .env.local before signing in."
      });
      return;
    }

    try {
      const { auth } = getFirebase();
      return onAuthStateChanged(
        auth,
        (user) => setState({ loading: false, user, error: "" }),
        (error) => setState({ loading: false, user: null, error: error.message })
      );
    } catch (error) {
      setState({
        loading: false,
        user: null,
        error: error instanceof Error ? error.message : "Firebase auth failed to start."
      });
    }
  }, []);

  return state;
}
