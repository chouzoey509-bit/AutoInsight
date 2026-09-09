import type { UserProfile } from '@/types'
import { get, put } from '@/utils/request'

/**
 * 用户中心接口
 * GET /api/users/me
 * PUT /api/users/me
 */
export const userApi = {
  profile(): Promise<UserProfile> {
    return get<UserProfile>('/users/me')
  },
  updateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
    return put<UserProfile>('/users/me', payload)
  }
}
