<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authentication';
import LeftNav from '@/layouts/common/LeftNav.vue';
import TopHeader from '@/layouts/common/TopHeader.vue';
import BaseModal from '@/components/common/BaseModal.vue';
import NotificationList from '@/views/academic/notification/NotificationList.vue';
import NotificationService from '@/services/notificationService';

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// [추가] 모바일에서 공개 페이지(/login 등) 접근 시 사이드바·헤더 숨김
// 이전 세션이 남아 isLogin=true인 상태로 /login 접근하면 사이드바가 뜨는 문제 방지
// PC는 화면이 넓어 영향 없으므로 모바일에서만 적용
const publicRoutes = ['/login', '/admin/login', '/auth/password']
const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
const showLayout = computed(() =>
  authStore.isLogin && !(isMobileDevice && publicRoutes.includes(route.path))
)
</script>


<template>
  <div :class="showLayout ? 'all-wrap' : 'log-in'">
    <TopHeader v-if="showLayout" />
    <LeftNav v-if="showLayout" />
    <main class="container">
      <RouterView />
    </main>
  </div>
  <BaseModal/>

  <!-- 알림 사이드 패널 -->
  <Teleport to="body">
    <div
      v-if="NotificationService.isPanelOpen.value"
      class="noti-backdrop"
      @click.self="NotificationService.isPanelOpen.value = false"
    >
      <div class="noti-panel">
        <NotificationList />
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.all-wrap {
  .container {
    background: #fff;
  }
}
</style>

<style lang="scss">
.noti-backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: flex-end;
}
.noti-panel {
  width: 33.33vw;
  min-width: 320px;
  height: 100vh;
  background: #fff;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
</style>
