<template>
  <div class="contact-view">
    <!-- 页面标题 -->
    <div class="contact-header">
      <h1 class="contact-header__title">联系我</h1>
      <p class="contact-header__desc">有想法？欢迎随时交流</p>
    </div>

    <div class="contact-content">
      <!-- 联系表单 -->
      <section class="contact-form">
        <md-outlined-text-field
          v-model="form.name"
          label="姓名"
          class="contact-form__field"
        ></md-outlined-text-field>
        <md-outlined-text-field
          v-model="form.email"
          label="邮箱"
          type="email"
          class="contact-form__field"
        ></md-outlined-text-field>
        <md-outlined-text-field
          v-model="form.subject"
          label="主题"
          class="contact-form__field"
        ></md-outlined-text-field>
        <md-outlined-text-field
          v-model="form.message"
          label="消息内容"
          type="textarea"
          rows="5"
          class="contact-form__field"
        ></md-outlined-text-field>
        <md-filled-button @click="handleSubmit" class="contact-form__submit">
          <span class="material-symbols-rounded" slot="icon">send</span>
          发送消息
        </md-filled-button>
      </section>

      <!-- 社交链接 -->
      <section class="social-section">
        <h2 class="social-section__title">其他方式</h2>
        <div class="social-grid">
          <a
            v-for="link in socialLinks"
            :key="link.name"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="social-card"
          >
            <span class="material-symbols-rounded social-card__icon">{{ link.icon }}</span>
            <div class="social-card__info">
              <span class="social-card__name">{{ link.name }}</span>
              <span class="social-card__desc">{{ link.desc }}</span>
            </div>
            <span class="material-symbols-rounded social-card__arrow">arrow_forward</span>
          </a>
        </div>
      </section>
    </div>

    <!-- 提交成功提示 -->
    <Teleport to="body">
      <div v-if="showToast" class="toast" @click="showToast = false">
        <span class="material-symbols-rounded">check_circle</span>
        消息已发送（示例）
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import '@material/web/textfield/outlined-text-field'
import '@material/web/button/filled-button'

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const showToast = ref(false)

function handleSubmit() {
  // 示例：仅展示 toast，不做实际发送
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
  form.name = ''
  form.email = ''
  form.subject = ''
  form.message = ''
}

const socialLinks = ref([
  {
    name: 'GitHub',
    desc: '查看开源项目',
    icon: 'code',
    url: 'https://github.com/BJY-STUDIO',
  },
  {
    name: '邮箱',
    desc: 'kernel@example.com',
    icon: 'mail',
    url: 'mailto:kernel@example.com',
  },
  {
    name: '掘金',
    desc: '技术文章分享',
    icon: 'article',
    url: '#',
  },
  {
    name: '微信',
    desc: 'Kernel_BJY',
    icon: 'chat',
    url: '#',
  },
])
</script>

<style scoped>
.contact-view {
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 32px;
  box-sizing: border-box;
}

/* ======== Header ======== */
.contact-header {
  padding: 16px 0 24px;
}

.contact-header__title {
  font-size: 32px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 40px;
}

.contact-header__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-top: 4px;
}

/* ======== Content ======== */
.contact-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* ======== Form ======== */
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-form__field {
  width: 100%;
}

.contact-form__submit {
  align-self: flex-start;
  --md-filled-button-icon-size: 18px;
}

.contact-form__submit .material-symbols-rounded {
  font-size: 18px;
  font-variation-settings: "FILL" 0, "wght" 400;
}

/* ======== Social Section ======== */
.social-section__title {
  font-size: 22px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  line-height: 28px;
  margin-bottom: 16px;
}

.social-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.social-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  background-color: var(--md-sys-color-surface-container, #f3edf7);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.social-card:hover {
  box-shadow: var(--md-sys-elevation-2, 0 1px 3px 1px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.3));
}

.social-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background-color: var(--md-sys-color-on-surface, #1c1b1f);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.social-card:hover::after {
  opacity: 0.08;
}

.social-card__icon {
  font-size: 24px;
  color: var(--md-sys-color-primary, #6750a4);
  font-variation-settings: "FILL" 0, "wght" 400;
  position: relative;
  z-index: 1;
}

.social-card__info {
  flex: 1;
  position: relative;
  z-index: 1;
}

.social-card__name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.social-card__desc {
  display: block;
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-top: 2px;
}

.social-card__arrow {
  font-size: 20px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  position: relative;
  z-index: 1;
  font-variation-settings: "FILL" 0, "wght" 400;
}

/* ======== Toast ======== */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  background-color: var(--md-sys-color-inverse-surface, #322f35);
  color: var(--md-sys-color-inverse-on-surface, #f5eff7);
  font-size: 14px;
  z-index: 600;
  cursor: pointer;
  animation: toast-in 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.toast .material-symbols-rounded {
  font-size: 20px;
  font-variation-settings: "FILL" 1, "wght" 400;
  color: var(--md-sys-color-inverse-primary, #d0bcff);
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* ======== 暗色主题 ======== */
:global([data-theme="dark"]) .social-card {
  background-color: var(--md-sys-color-surface-container, #211f26);
}

:global([data-theme="dark"]) .social-card::after {
  background-color: var(--md-sys-color-on-surface, #e6e1e5);
}

:global([data-theme="dark"]) .social-card__icon {
  color: var(--md-sys-color-primary, #d0bcff);
}
</style>
