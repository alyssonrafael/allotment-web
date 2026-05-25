import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const prefix = (import.meta.env.VITE_API_PREFIX ?? '/api/v1').replace(/\/$/, '')

export const api = axios.create({
  baseURL: `${baseURL}${prefix}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
})
