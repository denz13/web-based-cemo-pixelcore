import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../shared/firebase";
import { sendEmailVerification } from "firebase/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Email Validation ─────────────────────────────────────────────────────────

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerUser = async (data: RegisterData): Promise<User> => {
  const { firstName, lastName, email, password } = data;

  if (!isValidEmail(email)) {
    throw new Error("Please enter a valid email address.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  //  SEND EMAIL VERIFICATION
  await sendEmailVerification(user);

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    firstName,
    lastName,
    email,
    role: "citizen",
    createdAt: serverTimestamp(),
    isActive: true,
  });

  return user;
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginUser = async (data: LoginData): Promise<User> => {
  const { email, password } = data;

  if (!isValidEmail(email)) {
    throw new Error("Please enter a valid email address.");
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Fetch Firestore profile to check role
  const profile = await getUserProfile(user.uid);

  // Admins are created manually so skip email verification for them
  if (profile?.role !== "admin" && !user.emailVerified) {
    await signOut(auth);
    throw new Error("Please verify your email before logging in.");
  }

  return user;
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (email: string): Promise<void> => {
  if (!isValidEmail(email)) {
    throw new Error("Please enter a valid email address.");
  }
  await sendPasswordResetEmail(auth, email);
};

// ─── Get User Profile from Firestore ─────────────────────────────────────────

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

// ─── Auth State Listener ──────────────────────────────────────────────────────

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
