// Set true kapag Firebase na ang backend; i-wire ulit ang SDK calls.
export const AUTH_BACKEND_ENABLED = false;

const firebaseNotWired =
  "Firebase auth is not wired in this build. Keep AUTH_BACKEND_ENABLED false or implement Firebase.";

/** Temporary dev session (localStorage). Hindi ito tunay na seguridad. */
const DEV_SESSION_KEY = "cemo-pixelcore-dev-session";

type DevSession = {
  uid: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  role: string;
};

const authListeners = new Set<(user: AuthUser | null) => void>();

function readDevSession(): DevSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEV_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DevSession;
    if (!parsed?.uid || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDevSession(session: DevSession) {
  localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
}

function clearDevSession() {
  localStorage.removeItem(DEV_SESSION_KEY);
}

function notifyAuthListeners(user: AuthUser | null) {
  authListeners.forEach((cb) => cb(user));
}

function devEmailIsAdmin(email: string): boolean {
  return email.trim().toLowerCase() === "admin@localhost";
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== DEV_SESSION_KEY) return;
    const s = readDevSession();
    notifyAuthListeners(s ? devSessionToAuthUser(s) : null);
  });
}

function devSessionToAuthUser(s: DevSession): AuthUser {
  return {
    uid: s.uid,
    email: s.email,
    emailVerified: s.emailVerified,
  };
}

function devSessionToProfile(s: DevSession): UserProfile {
  return {
    uid: s.uid,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    role: s.role,
    createdAt: null,
    isActive: true,
  };
}

/** Minimal shape login/register return for callers */
export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: unknown;
  isActive: boolean;
}

export const isValidEmail = (email: string): boolean => {
  const t = email.trim();
  if (!t || /\s/.test(t) || !t.includes("@")) return false;
  const at = t.lastIndexOf("@");
  const local = t.slice(0, at);
  const domain = t.slice(at + 1).toLowerCase();
  if (!local || !domain || domain.includes("@")) return false;
  if (!/^[^\s@]+$/.test(local)) return false;
  // Dev: admin@localhost
  if (domain === "localhost" || domain.endsWith(".local")) return true;
  // Normal: must have a dot in the domain (you@example.com)
  return domain.includes(".");
};

export const registerUser = async (data: RegisterData): Promise<AuthUser> => {
  if (AUTH_BACKEND_ENABLED) throw new Error(firebaseNotWired);

  const { firstName, lastName, email, password } = data;
  if (!firstName.trim() || !lastName.trim()) {
    throw new Error("First and last name are required.");
  }
  if (!isValidEmail(email)) throw new Error("Please enter a valid email address.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const normalized = email.trim().toLowerCase();
  const existing = readDevSession();
  if (existing?.email.toLowerCase() === normalized) {
    throw new Error("email-already-in-use");
  }

  const session: DevSession = {
    uid: `dev:${normalized}`,
    email: email.trim(),
    emailVerified: true,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    role: devEmailIsAdmin(email) ? "admin" : "citizen",
  };
  writeDevSession(session);
  notifyAuthListeners(devSessionToAuthUser(session));
  return devSessionToAuthUser(session);
};

export const loginUser = async (data: LoginData): Promise<AuthUser> => {
  if (AUTH_BACKEND_ENABLED) throw new Error(firebaseNotWired);

  const { email, password } = data;
  if (!isValidEmail(email)) throw new Error("Please enter a valid email address.");
  if (password.length < 4) {
    throw new Error("invalid-credential");
  }

  const normalized = email.trim().toLowerCase();
  const session: DevSession = {
    uid: `dev:${normalized}`,
    email: email.trim(),
    emailVerified: true,
    firstName: normalized.split("@")[0] ?? "User",
    lastName: "",
    role: devEmailIsAdmin(email) ? "admin" : "citizen",
  };
  writeDevSession(session);
  notifyAuthListeners(devSessionToAuthUser(session));
  return devSessionToAuthUser(session);
};

export const logoutUser = async (): Promise<void> => {
  if (AUTH_BACKEND_ENABLED) throw new Error(firebaseNotWired);

  clearDevSession();
  notifyAuthListeners(null);
};

export const forgotPassword = async (_email: string): Promise<void> => {
  if (AUTH_BACKEND_ENABLED) throw new Error(firebaseNotWired);
  await Promise.resolve();
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (AUTH_BACKEND_ENABLED) throw new Error(firebaseNotWired);

  await Promise.resolve();
  const s = readDevSession();
  if (!s || s.uid !== uid) return null;
  return devSessionToProfile(s);
};

export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  authListeners.add(callback);
  queueMicrotask(() => {
    const s = readDevSession();
    callback(s ? devSessionToAuthUser(s) : null);
  });
  return () => {
    authListeners.delete(callback);
  };
};
