import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Returns the backend URL, using VITE_BACKEND_URL if set, otherwise defaults to local backend for development
export const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
};
