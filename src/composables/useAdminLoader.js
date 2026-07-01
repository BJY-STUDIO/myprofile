/**
 * Admin 模块共享加载逻辑
 * 提供：progress bar 时间推进、fadeIn 动画控制、冷启动指数退避重试
 */
import { ref, onUnmounted } from 'vue'
import { cmList } from '@/services/articleService'

// ======== 冷启动重试常量 ========
const RETRY_BASE_DELAY = 3000
const RETRY_MAX_DELAY = 30000
const MAX_RETRY_ATTEMPTS = 5

// ======== Progress Bar 时间驱动推进 ========
const TICK_MS = 500

/**
 * 创建一个 admin 模块加载控制器
 * @returns 控制器对象，包含 reactive 状态和方法
 */
export function useAdminLoader() {
  // 进度条
  const loadingActive = ref(false)
  const loadingFading = ref(false)
  const progressValue = ref(0)
  const progressBuffer = ref(0.2)
  let progressTimer = null

  // 数据加载状态
  const dataLoaded = ref(false)  // 数据是否就绪（控制骨架/内容切换）
  const dataEmpty = ref(false)   // 数据为空

  // fadeIn 控制
  const fadeInActive = ref(false)

  function startProgressAnimation(startValue = 0, startBuffer = 0.2) {
    stopProgressAnimation()
    progressValue.value = startValue
    progressBuffer.value = startBuffer
    loadingActive.value = true
    loadingFading.value = false

    progressTimer = setInterval(() => {
      const v = progressValue.value
      const b = progressBuffer.value
      let dv, db
      if (v < 0.15)      { dv = 0.025; db = 0.035 }
      else if (v < 0.40) { dv = 0.012; db = 0.020 }
      else if (v < 0.65) { dv = 0.006; db = 0.012 }
      else if (v < 0.85) { dv = 0.002; db = 0.006 }
      else               { dv = 0.0005; db = 0.002 }

      progressValue.value = Math.min(v + dv, 0.95)
      progressBuffer.value = Math.min(b + db, 0.98)
    }, TICK_MS)
  }

  function stopProgressAnimation() {
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = null
    }
  }

  function onRetryAttempt(attempt) {
    const jumpedValue = Math.min(0.10 + (attempt / MAX_RETRY_ATTEMPTS) * 0.60, 0.85)
    const jumpedBuffer = Math.min(jumpedValue + 0.15, 0.95)
    if (jumpedValue > progressValue.value) progressValue.value = jumpedValue
    if (jumpedBuffer > progressBuffer.value) progressBuffer.value = jumpedBuffer
  }

  function fadeOutProgress() {
    stopProgressAnimation()
    loadingFading.value = true
    setTimeout(() => {
      loadingActive.value = false
      loadingFading.value = false
    }, 400)
  }

  /**
   * 数据加载完成后的过渡流程：
   * 1. 进度条 value 跳满 → fade 消失
   * 2. 骨架消失 + 真实内容 fadeIn
   */
  function transitionToLoaded(empty = false) {
    dataEmpty.value = empty
    // 进度条结束
    progressValue.value = 1
    progressBuffer.value = 1
    fadeOutProgress()
    // 短延迟后切换内容（让进度条先开始 fade）
    setTimeout(() => {
      dataLoaded.value = true
      // fadeIn 动画
      requestAnimationFrame(() => {
        fadeInActive.value = true
      })
    }, 150)
  }

  /**
   * 带冷启动重试的 cmList 调用
   * @param {string} token - Admin JWT token
   * @param {string} uid - Strapi content type UID
   * @param {object} params - cmList 查询参数
   * @param {function} onSuccess - 成功回调(results)
   * @param {function} onEmpty - 空结果回调（可选，默认也走 onSuccess）
   */
  async function loadWithRetry(token, uid, params, onSuccess, onEmpty) {
    dataLoaded.value = false
    dataEmpty.value = false
    fadeInActive.value = false

    startProgressAnimation(0, 0.2)

    // 首次尝试
    try {
      const { results } = await cmList(token, uid, params)
      if (results.length > 0) {
        onSuccess(results)
        transitionToLoaded(false)
        return
      }
      // 空结果也视为成功
      if (onEmpty) onEmpty(results)
      else onSuccess(results)
      transitionToLoaded(true)
      return
    } catch (e) {
      console.warn(`[adminLoader] 首次加载 ${uid} 失败，启动重试:`, e.message)
    }

    // 指数退避重试
    let attempt = 0
    while (attempt < MAX_RETRY_ATTEMPTS) {
      attempt++
      const delay = Math.min(RETRY_BASE_DELAY * Math.pow(2, attempt - 1), RETRY_MAX_DELAY)
      await new Promise(resolve => setTimeout(resolve, delay))

      onRetryAttempt(attempt)

      try {
        const { results } = await cmList(token, uid, params)
        if (results.length > 0) {
          onSuccess(results)
          transitionToLoaded(false)
          return
        }
        if (onEmpty) onEmpty(results)
        else onSuccess(results)
        transitionToLoaded(true)
        return
      } catch {
        console.warn(`[adminLoader] 重试 ${attempt}/${MAX_RETRY_ATTEMPTS} 失败`)
      }
    }

    // 所有重试都失败
    console.error(`[adminLoader] ${uid} 加载失败，已耗尽所有重试`)
    transitionToLoaded(true)
  }

  /**
   * 静默重新加载（不显示进度条和骨架，仅刷新数据）
   * 用于 CRUD 操作后刷新列表
   */
  async function silentReload(token, uid, params, onSuccess) {
    try {
      const { results } = await cmList(token, uid, params)
      onSuccess(results)
    } catch (e) {
      console.error(`[adminLoader] 静默重载 ${uid} 失败:`, e)
      throw e
    }
  }

  /**
   * 带进度条和重试的自定义加载函数
   * 用于不使用 cmList 的模块（如 NavManager 使用 blogStore）
   * @param {function} fetchFn - 异步数据获取函数，应 throw 表示失败
   * @param {function} onSuccess - 成功回调(result)
   * @param {function} isEmptyFn - 判断结果是否为空虚的函数，返回 true 则重试 (result) => boolean
   */
  async function loadCustom(fetchFn, onSuccess, isEmptyFn) {
    dataLoaded.value = false
    dataEmpty.value = false
    fadeInActive.value = false

    startProgressAnimation(0, 0.2)

    // 首次尝试
    try {
      const result = await fetchFn()
      if (!isEmptyFn(result)) {
        onSuccess(result)
        transitionToLoaded(false)
        return
      }
      // 结果为空，也视为需要重试（可能是冷启动 API 返回空）
      console.warn('[adminLoader] 首次加载结果为空，启动重试')
    } catch (e) {
      console.warn('[adminLoader] 首次加载失败，启动重试:', e.message)
    }

    // 指数退避重试
    let attempt = 0
    while (attempt < MAX_RETRY_ATTEMPTS) {
      attempt++
      const delay = Math.min(RETRY_BASE_DELAY * Math.pow(2, attempt - 1), RETRY_MAX_DELAY)
      await new Promise(resolve => setTimeout(resolve, delay))

      onRetryAttempt(attempt)

      try {
        const result = await fetchFn()
        if (!isEmptyFn(result)) {
          onSuccess(result)
          transitionToLoaded(false)
          return
        }
        console.warn(`[adminLoader] 重试 ${attempt}/${MAX_RETRY_ATTEMPTS} 结果为空`)
      } catch {
        console.warn(`[adminLoader] 重试 ${attempt}/${MAX_RETRY_ATTEMPTS} 失败`)
      }
    }

    // 所有重试都失败或结果持续为空
    console.error('[adminLoader] 自定义加载失败，已耗尽所有重试')
    transitionToLoaded(true)
  }

  /**
   * 静默重新加载（自定义函数版本）
   * 用于 CRUD 操作后刷新数据
   */
  async function silentReloadCustom(fetchFn, onSuccess) {
    try {
      const result = await fetchFn()
      onSuccess(result)
    } catch (e) {
      console.error('[adminLoader] 静默重载失败:', e)
      throw e
    }
  }

  onUnmounted(() => {
    stopProgressAnimation()
  })

  return {
    // Reactive 状态
    loadingActive,
    loadingFading,
    progressValue,
    progressBuffer,
    dataLoaded,
    dataEmpty,
    fadeInActive,
    // 方法
    loadWithRetry,
    silentReload,
    loadCustom,
    silentReloadCustom,
    startProgressAnimation,
    transitionToLoaded,
    onRetryAttempt,
  }
}
