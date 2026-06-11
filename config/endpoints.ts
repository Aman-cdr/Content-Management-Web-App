export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3040/api/v1';


export const ENDPOINTS = {
  CONTENT: {
    GET_ALL: '/content/list',
    CREATE: '/content/create',
    UPDATE: (id: string) => `/content/update/${id}`,
    DELETE: (id: string) => `/content/delete/${id}`,
    BULK_DELETE: '/content/delete-bulk',
    BULK_UPDATE: '/content/update-bulk',
  },
  SERIES: {
    GET_ALL: '/series/list',
    CREATE: '/series/create',
    GET_BY_ID: (id: string) => `/series/get/${id}`,
    UPDATE: (id: string) => `/series/update/${id}`,
    DELETE: (id: string) => `/series/delete/${id}`,
    GET_CONTENTS: (id: string) => `/series/${id}/contents`,
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
  USER: {
    LOGIN: '/user/login',
    REGISTER: '/user/register',
  },
  DEVICE: {
    REGISTER: '/device/register',
  },
  UPLOAD: {
    VIDEO: '/upload/video',
    THUMBNAIL: '/upload/thumbnail',
    LIST: '/upload/list',
    GET_BY_ID: (id: string) => `/upload/${id}`,
    DELETE: (id: string) => `/upload/${id}`,
  },
  PUBLISH: {
    CREATE: '/publish/create',
    LIST: '/publish/list',
    GET_BY_ID: (id: string) => `/publish/${id}`,
    CANCEL: (id: string) => `/publish/${id}`,
  },
  GENERATE: '/generate',
  ANALYTICS: '/analytics',
  GENERATE_SCRIPT: '/generate-script',
  RESCHEDULE: '/reschedule',
  GENERATE_THUMBNAIL: '/generate-thumbnail',
};
