<template>
  <div class="login">
    <section class="login__visual">
      <div class="login__visual-bg" />
      <div class="login__visual-content">
        <div class="login__topline"><div class="login__logo"><span class="login__logo-mark">AI</span><div class="login__logo-text"><b>AUTOINSIGHT</b><em>汽车行业数据智能平台</em></div></div><span class="login__serial">SYSTEM / 01</span></div>
        <div class="login__hero-copy"><span class="login__eyebrow">AUTOMOTIVE INTELLIGENCE</span><h1>从行业数据<br />到经营决策</h1><p>连接市场、车型与经营数据，用一个统一的数据视图看见汽车行业的变化。</p></div>
        <div class="login__visual-bottom"><div class="login__features"><div><span>01</span><p>市场销量与新能源渗透</p></div><div><span>02</span><p>车型分析与品牌竞争</p></div><div><span>03</span><p>预测模型与经营洞察</p></div><div><span>04</span><p>企业级数据驾驶舱</p></div></div><div class="login__stats"><div v-for="s in stats" :key="s.label"><b class="ai-num">{{ s.value }}</b><span>{{ s.label }}</span></div></div></div>
      </div>
      <p class="login__visual-foot">示例数据环境 · 数据更新时间：模拟</p>
    </section>

    <section class="login__panel">
      <div class="login__card">
        <header class="login__card-head"><span class="login__section-kicker">ACCOUNT ACCESS</span><h2>账号登录</h2><p>请使用企业账号登录 AutoInsight 平台</p></header>
        <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="onSubmit">
          <el-form-item prop="username"><el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" clearable /></el-form-item>
          <el-form-item prop="password"><el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password clearable /></el-form-item>
          <el-form-item prop="captcha"><div class="login__captcha"><el-input v-model="form.captcha" placeholder="验证码（后端未启用时可留空）" :prefix-icon="Key" /><button type="button" class="login__captcha-img" @click="captchaText = randomCaptcha()"><span class="ai-num">{{ captchaText }}</span></button></div></el-form-item>
          <div class="login__row"><el-checkbox v-model="form.remember">记住登录状态</el-checkbox><el-button link type="primary" @click="ElMessage.info('请联系系统管理员重置密码')">忘记密码？</el-button></div>
          <el-button type="primary" class="login__submit" :loading="loading" @click="onSubmit">{{ loading ? '登录中…' : '登 录' }}</el-button>
        </el-form>
        <div class="login__demo"><div class="login__demo-head"><span>DEMO ACCOUNT</span><em>点击任意账号快速填充</em></div><div class="login__demo-list"><button v-for="acc in demoAccounts" :key="acc.username" type="button" class="login__demo-item" @click="fillAccount(acc)"><b>{{ acc.username }}</b><span>{{ acc.desc }}</span></button></div></div>
        <p class="login__foot">登录即表示同意《平台使用协议》与《数据保密协议》</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { DataBoard, DataLine, Key, Lock, MagicStick, TrendCharts, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { roleHome } from '@/router'
import type { LoginPayload } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const ElMessageRef = ElMessage
const formRef = ref<FormInstance>()
const loading = ref(false)
const demoAccounts: { username: string; password: string; desc: string }[] = [
  { username: 'admin', password: 'admin123', desc: '系统管理员 · 全部权限' },
  { username: 'analyst', password: 'analyst123', desc: '数据分析师 · 分析与预测' },
  { username: 'sales', password: 'sales123', desc: '销售运营 · 车型与订单' },
  { username: 'user', password: 'user123', desc: '普通用户 · 浏览与推荐' }
]
const form = reactive<LoginPayload & { captcha: string }>({ username: 'admin', password: 'admin123', remember: true, captcha: '' })
const rules: FormRules = { username: [{ required: true, message: '请输入用户名', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }] }
const captchaText = ref(randomCaptcha())
function randomCaptcha(): string { const chars = 'ACDEFHJKLMNPQRTUVWXY34678'; return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') }
function fillAccount(acc: { username: string; password: string }): void { form.username = acc.username; form.password = acc.password; ElMessageRef.success(`已填充演示账号：${acc.username}`) }
async function onSubmit(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const user = await userStore.login({ username: form.username, password: form.password, remember: form.remember, captcha: form.captcha })
    ElMessageRef.success(`欢迎回来，${user.nickname}`)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    await router.replace(redirect || roleHome(user.role))
  } catch (e) { ElMessageRef.error(e instanceof Error ? e.message : '登录失败，请重试'); captchaText.value = randomCaptcha() }
  finally { loading.value = false }
}
const stats = [{ label: '覆盖品牌', value: '30+' }, { label: '在售车型', value: '158' }, { label: '历史月份', value: '24' }, { label: '省级区域', value: '34' }]
</script>

<style scoped lang="scss">
.login { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(480px, .85fr); background: var(--ai-bg-base); }
.login__visual { position: relative; display: flex; min-width: 0; flex-direction: column; justify-content: space-between; padding: 36px 48px 32px; overflow: hidden; background: #111; color: #fff; }
.login__visual::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px); background-size: 56px 56px; mask-image: radial-gradient(circle at 20% 40%, #000, transparent 72%); pointer-events: none; }
.login__visual-content, .login__visual-foot { position: relative; z-index: 1; }
.login__topline { display: flex; justify-content: space-between; align-items: flex-start; }
.login__logo { display: flex; align-items: center; gap: 12px; }
.login__logo-mark { display: grid; place-items: center; width: 36px; height: 36px; background: #fff; color: #111; font-size: 11px; font-weight: 700; }
.login__logo-text b { display: block; font-size: 15px; letter-spacing: .03em; }
.login__logo-text em { display: block; margin-top: 3px; color: #8d8d88; font-size: 10px; font-style: normal; }
.login__serial { color: #6f6f6b; font-family: var(--ai-font-mono); font-size: 9px; letter-spacing: .12em; }
.login__hero-copy { max-width: 680px; margin: auto 0; }
.login__eyebrow, .login__section-kicker { color: #8d8d88; font-family: var(--ai-font-mono); font-size: 10px; letter-spacing: .14em; }
.login__hero-copy h1 { margin-top: 18px; font-size: clamp(46px, 5.2vw, 72px); line-height: 1.02; letter-spacing: -.05em; font-weight: 600; }
.login__hero-copy p { max-width: 520px; margin-top: 24px; color: #aaa9a4; font-size: 14px; line-height: 1.8; }
.login__features { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.12); }
.login__features div, .login__stats div { min-width: 0; }
.login__features span { color: #777; font-family: var(--ai-font-mono); font-size: 9px; }
.login__features p { margin-top: 7px; color: #dddcd8; font-size: 11px; line-height: 1.5; }
.login__stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; margin-top: 22px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.08); }
.login__stats b { color: #fff; font-size: 20px; font-weight: 500; }
.login__stats span { display: block; margin-top: 3px; color: #777; font-size: 9px; }
.login__visual-foot { margin-top: 20px; color: #666; font-family: var(--ai-font-mono); font-size: 9px; }
.login__panel { display: flex; align-items: center; justify-content: center; min-width: 0; padding: 48px 56px; background: var(--ai-bg-base); }
.login__card { width: min(100%, 420px); min-width: 0; }
.login__card-head { margin-bottom: 30px; }
.login__card-head h2 { margin-top: 10px; color: var(--ai-text-1); font-size: 34px; font-weight: 600; letter-spacing: -.03em; }
.login__card-head p { margin-top: 8px; color: var(--ai-text-3); font-size: 13px; }
.login__captcha { display: grid; grid-template-columns: minmax(0, 1fr) 108px; gap: 8px; width: 100%; }
.login__captcha-img { display: grid; place-items: center; border: 1px dashed var(--ai-border-dashed); background: #fff; color: #111; cursor: pointer; }
.login__captcha-img span { font-family: var(--ai-font-mono); font-size: 16px; letter-spacing: .22em; }
.login__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 22px; }
.login__submit { width: 100%; height: 46px; border: 0; background: #111; font-size: 13px; letter-spacing: .12em; }
.login__demo { margin-top: 28px; padding-top: 22px; border-top: 1px solid var(--ai-border); }
.login__demo-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.login__demo-head span { color: var(--ai-text-2); font-family: var(--ai-font-mono); font-size: 10px; letter-spacing: .1em; }
.login__demo-head em { color: var(--ai-text-4); font-size: 10px; font-style: normal; }
.login__demo-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
.login__demo-item { min-width: 0; padding: 12px; border: 1px solid var(--ai-border); background: #fff; text-align: left; cursor: pointer; transition: border-color var(--ai-duration-base) var(--ai-ease); }
.login__demo-item:hover { border-color: var(--ai-brand); }
.login__demo-item b { display: block; color: #111; font-family: var(--ai-font-mono); font-size: 11px; }
.login__demo-item span { display: block; margin-top: 5px; color: var(--ai-text-4); font-size: 10px; line-height: 1.5; overflow-wrap: anywhere; }
.login__foot { margin-top: 22px; color: var(--ai-text-4); font-size: 10px; line-height: 1.6; }
@media (max-width: 1100px) { .login { grid-template-columns: minmax(0,1fr); } .login__visual { min-height: 440px; } .login__panel { padding-block: 42px; } }
@media (max-width: 700px) { .login__visual { min-height: 460px; padding: 28px 24px; } .login__hero-copy h1 { font-size: 44px; } .login__features, .login__stats { grid-template-columns: repeat(2, minmax(0,1fr)); } .login__panel { padding: 32px 20px; } .login__demo-list { grid-template-columns: minmax(0,1fr); } }
</style>
