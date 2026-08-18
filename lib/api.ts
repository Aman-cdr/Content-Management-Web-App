/**
 * Re-export the centralized httpClient.
 * 
 * This file exists for backward compatibility.
 * New code should import directly from '@/lib/axios-instance' or use hooks from '@/hooks'.
 */
import httpClient from './axios-instance';
export { TokenStorage } from './axios-instance';
export type { ApiResponseType } from './axios-instance';
export default httpClient;
