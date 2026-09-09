import type { LoginPayload, LoginResult, UserProfile } from '@/types'
import { get, post } from '@/utils/request'

/**
 * 认证相关接口
 * POST /api/auth/login
 * POST /api/auth/register
 * GET  /api/users/me
 */
export const authApi = {
  /** 登录（错误提示由页面自行处理，故 silent）。后端返回 access_token，统一映射为前端 token */
  login(payload: LoginPayload): Promise<LoginResult> {
    return post<any>('/auth/login', payload, { silent: true }).then((d) => ({
      token: d.accessToken ?? d.access_token ?? '',
      user: d.user
    }))
  },
  register(payload: { username: string; password: string; nickname?: string; email?: string }): Promise<UserProfile> {
    return post<any>('/auth/register', payload, { silent: true }).then((d) => ({
      id: d.id,
      username: d.username,
      nickname: d.nickname ?? d.username,
      role: d.role ?? 'user',
      email: d.email,
      status: d.isActive === false ? 'disabled' : 'active',
      createdAt: d.createdAt ?? ''
    }))
  },
  me(): Promise<UserProfile> {
    return get<any>('/users/me', undefined, { silent: true }).then((d) => ({
      id: d.id,
      username: d.username,
      nickname: d.nickname ?? d.username,
      role: d.role ?? 'user',
      email: d.email,
      status: d.isActive === false ? 'disabled' : 'active',
      createdAt: d.createdAt ?? ''
    }))
  },
  logout(): Promise<null> {
    return post<null>('/auth/logout', undefined, { silent: true })
  }
}
