"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { SEED_USERS, type User } from "./types";
import type { TranslationKey } from "./i18n";

const USERS_KEY = "pos.users";
const SESSION_KEY = "pos.session";

export type SignUpPayload = {
  storeName: string;
  ownerName: string;
  email: string;
  password: string;
};

/**
 * Results carry a dictionary key rather than a sentence, so the screen that shows
 * the failure renders it in whichever language is active.
 */
type Result = { ok: boolean; error?: TranslationKey };

type Auth = {
  user: User | null;
  users: User[];
  createUser: (u: Omit<User, "id">) => Result;
  updateUser: (id: string, patch: Partial<Omit<User, "id">>) => Result;
  deleteUser: (id: string) => Result;
  signIn: (email: string, password: string) => Result;
  signUp: (payload: SignUpPayload) => Result;
  signOut: () => void;
};

const AuthContext = createContext<Auth | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Mocked authentication: accounts live in localStorage and passwords are compared
 * in plain text. Swap `signIn`/`signUp` for API calls when a backend exists.
 */
/** Accounts saved before roles were reworked used "owner" and had no `active` flag. */
function migrate(list: User[]): User[] {
  return list.map((u) => ({
    ...u,
    role: (u.role as string) === "owner" ? "admin" : u.role,
    active: u.active ?? true,
  }));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => migrate(read(USERS_KEY, SEED_USERS)));
  const [user, setUser] = useState<User | null>(() => {
    const stored = read<User | null>(SESSION_KEY, null);
    return stored ? migrate([stored])[0] : null;
  });

  const persistUsers = (next: User[]) => {
    setUsers(next);
    localStorage.setItem(USERS_KEY, JSON.stringify(next));
  };

  const startSession = (u: User) => {
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  };

  const signIn = useCallback(
    (email: string, password: string): Result => {
      const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) return { ok: false, error: "error.noAccount" };
      if (found.password !== password) return { ok: false, error: "error.wrongPassword" };
      if (!found.active) return { ok: false, error: "error.deactivated" };
      startSession(found);
      return { ok: true };
    },
    [users]
  );

  const signUp = useCallback(
    ({ ownerName, email, password }: SignUpPayload): Result => {
      if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        return { ok: false, error: "error.emailTaken" };
      }
      const created: User = {
        id: crypto.randomUUID(),
        name: ownerName.trim(),
        email: email.trim(),
        password,
        role: "admin",
        active: true,
      };
      persistUsers([...users, created]);
      startSession(created);
      return { ok: true };
    },
    [users]
  );

  const emailTaken = useCallback(
    (email: string, exceptId?: string) =>
      users.some((u) => u.id !== exceptId && u.email.toLowerCase() === email.trim().toLowerCase()),
    [users]
  );

  const createUser = useCallback(
    (input: Omit<User, "id">): Result => {
      if (emailTaken(input.email)) {
        return { ok: false, error: "error.emailTaken" };
      }
      persistUsers([...users, { ...input, id: crypto.randomUUID(), email: input.email.trim() }]);
      return { ok: true };
    },
    [users, emailTaken]
  );

  const updateUser = useCallback(
    (id: string, patch: Partial<Omit<User, "id">>): Result => {
      if (patch.email && emailTaken(patch.email, id)) {
        return { ok: false, error: "error.emailTaken" };
      }
      const next = users.map((u) => (u.id === id ? { ...u, ...patch } : u));
      // Never leave the store without an admin who can sign in.
      if (!next.some((u) => u.role === "admin" && u.active)) {
        return { ok: false, error: "error.needAdmin" };
      }
      persistUsers(next);
      if (user?.id === id) startSession(next.find((u) => u.id === id)!);
      return { ok: true };
    },
    [users, user, emailTaken]
  );

  const deleteUser = useCallback(
    (id: string): Result => {
      if (user?.id === id) return { ok: false, error: "error.cannotRemoveSelf" };
      const next = users.filter((u) => u.id !== id);
      if (!next.some((u) => u.role === "admin" && u.active)) {
        return { ok: false, error: "error.needAdmin" };
      }
      persistUsers(next);
      return { ok: true };
    },
    [users, user]
  );

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, users, createUser, updateUser, deleteUser, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
