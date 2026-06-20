/**
 * 首页视图
 * 包含欢迎对话框和加载动画
 */
<template>
  <div class="home-view">
    <md-dialog ref="dialogRef">
      <div slot="headline">Hello world!</div>
      <form slot="content" id="welcome-form" method="dialog">
        欢迎访问我的个人博客，该博客正在建设中。
      </form>
      <div slot="actions">
        <md-text-button form="welcome-form" value="cancel">取消</md-text-button>
        <md-text-button form="welcome-form" value="ok">确认</md-text-button>
      </div>
    </md-dialog>

    <div class="form-container">
      <div class="form-element">
        <md-outlined-button @click="openDialog">欢迎</md-outlined-button>
      </div>
      <div class="form-element">
        <md-circular-progress four-color indeterminate></md-circular-progress>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const dialogRef = ref(null)

function openDialog() {
  dialogRef.value?.show()
}
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.form-element {
  margin-bottom: 10px;
}
</style>
