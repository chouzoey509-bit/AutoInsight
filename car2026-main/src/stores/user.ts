import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import type { LoginPayload, UserProfile, UserRole } from '@/types'
import { clearAuth, getCachedUser, getToken, setCachedUser, setToken } from '@/utils/auth'

/**
 * 用户与权限 Store
 * 负责：登录态、Token、角色、权限判断
 */
export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken())
  const profile = ref<UserProfile | null>(getCachedUser<UserProfile>())
  const loading = ref(false)

  const isLogin = computed(() => Boolean(token.value))
  const role = computed<UserRole>(() => profile.value?.role ?? 'user')
  const nickname = computed(() => profile.value?.nickname ?? profile.value?.username ?? '未登录')
  const avatarText = computed(() => (profile.value?.nickname ?? profile.value?.username ?? 'U').slice(0, 1))

  /** 角色是否命中（未传 roles 表示不限制） */
  function hasRole(roles?: UserRole[]): boolean {
    if (!roles || !roles.length) return true
    return roles.includes(role.value)
  }

  /** 是否拥有管理后台权限 */
  const isAdmin = computed(() => role.value === 'admin')

  async function login(payload: LoginPayload): Promise<UserProfile> {
    loading.value = true
    try {
      const res = await authApi.login(payload)
      token.value = res.token
      profile.value = res.user
      setToken(res.token, payload.remember !== false)
      setCachedUser(res.user)
      return res.user
    } finally {
      loading.value = false
    }
  }

  function logout(): void {
    token.value = ''
    profile.value = null
    clearAuth()
  }

  /** 刷新当前用户信息（后端完成 /users/me 后可用） */
  async function fetchProfile(): Promise<void> {
    if (!token.value) return
    try {
      const res = await authApi.me()
      profile.value = res
      setCachedUser(res)
    } catch {
      /* Token 失效时由请求层统一跳转登录 */
    }
  }

  return {
    token,
    profile,
    loading,
    isLogin,
    role,
    nickname,
    avatarText,
    isAdmin,
    hasRole,
    login,
    logout,
    fetchProfile
  }
})
