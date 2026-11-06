"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AuthUser = {
  name: string;
  email: string;
};

type StoredAccount = AuthUser & {
  salt: string;
  passwordHash: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  signup: (input: SignupInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

export type SignupInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCOUNTS_KEY = "nexmarga.auth.accounts";
const SESSION_KEY = "nexmarga.auth.session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUser(readSession());
    setIsReady(true);
  }, []);

  const signup = useCallback(async ({ name, email, password }: SignupInput) => {
    const normalizedEmail = normalizeEmail(email);
    const accounts = readAccounts();

    if (accounts.some((account) => normalizeEmail(account.email) === normalizedEmail)) {
      throw new Error("An account with this email already exists.");
    }

    const salt = createSalt();
    const account: StoredAccount = {
      name: name.trim(),
      email: normalizedEmail,
      salt,
      passwordHash: await hashPassword(password, salt),
    };

    writeAccounts([...accounts, account]);
  }, []);

  const login = useCallback(async ({ email, password }: LoginInput) => {
    const normalizedEmail = normalizeEmail(email);
    const account = readAccounts().find((item) => normalizeEmail(item.email) === normalizedEmail);

    if (!account) {
      throw new Error("Invalid email or password.");
    }

    const passwordHash = await hashPassword(password, account.salt);

    if (passwordHash !== account.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    const sessionUser = { name: account.name, email: account.email };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isReady,
      signup,
      login,
      logout,
    }),
    [isReady, login, logout, signup, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readAccounts(): StoredAccount[] {
  const storedValue = window.localStorage.getItem(ACCOUNTS_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isStoredAccount);
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function readSession(): AuthUser | null {
  const storedValue = window.localStorage.getItem(SESSION_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue);
    return isAuthUser(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthUser>;

  return typeof candidate.name === "string" && typeof candidate.email === "string";
}

function isStoredAccount(value: unknown): value is StoredAccount {
  if (!isAuthUser(value)) {
    return false;
  }

  const candidate = value as Partial<StoredAccount>;

  return typeof candidate.salt === "string" && typeof candidate.passwordHash === "string";
}

function createSalt() {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string) {
  const payload = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await window.crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
