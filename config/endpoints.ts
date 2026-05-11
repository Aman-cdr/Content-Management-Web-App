export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const ENDPOINTS = {
  CONTENT: {
    GET_ALL: '/content',
    CREATE: '/content',
    UPDATE: (id: string) => `/content/${id}`,
    DELETE: (id: string) => `/content/${id}`,
    BULK_DELETE: '/content/bulk',
    BULK_UPDATE: '/content/bulk',
  },
  ROADMAP: {
    GET_ALL: '/roadmap',
    CREATE: '/roadmap',
    UPDATE: (id: string) => `/roadmap/${id}`,
    DELETE: (id: string) => `/roadmap/${id}`,
  },
  MEDIA: {
    GET_ALL: '/media',
    CREATE: '/media',
    DELETE: (id: string) => `/media/${id}`,
  },
  GENERATE: '/generate',
  ANALYTICS: '/analytics',
  GENERATE_SCRIPT: '/generate-script',
  RESCHEDULE: '/reschedule',
  GENERATE_THUMBNAIL: '/generate-thumbnail',
};
