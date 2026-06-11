/**
 * Device registration utilities.
 * 
 * This file exists for backward compatibility.
 * New code should use the `useDeviceRegister` hook from '@/hooks'.
 */

export { TokenStorage } from './axios-instance';

/**
 * @deprecated Use the `useDeviceRegister` hook instead.
 */
export function getDeviceToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cms_bearer_token');
}
