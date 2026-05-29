<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import AnnouncementService from '@/services/announcementService'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const anno      = ref(null)
const isLoading = ref(false)

const fetchDetail = async () => {
    isLoading.value = true
    try {
        anno.value = await AnnouncementService.getDetail(route.params.annoId)
    } catch (e) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

const handleDelete = async () => {
    if (!confirm('공지사항을 삭제하시겠습니까?')) return
    try {
        await AnnouncementService.remove(anno.value.annoId)
        router.push('/announcements')
    } catch (e) {
        console.error(e)
    }
}

const formatDate = (dateStr) => dateStr?.slice(0, 16).replace('T', ' ') ?? ''

onMounted(fetchDetail)
</script>

<template>
  <div class="page-wrap">
    <div v-if="isLoading" class="empty-msg">불러오는 중...</div>
    <template v-else-if="anno">
      <div class="detail-header">
        <span class="badge">{{ anno.targetRole }}</span>
        <h2>{{ anno.title }}</h2>
        <div class="meta">
          <span>{{ anno.writerName }}</span>
          <span>조회 {{ anno.viewCount }}</span>
          <span>{{ formatDate(anno.createdAt) }}</span>
        </div>
      </div>

      <div class="detail-body">{{ anno.content }}</div>

      <div class="btn-row">
        <button class="btn-outline" @click="router.back()">목록으로</button>
        <template v-if="authStore.role === 'ADMIN'">
          <button class="btn-primary" @click="router.push(`/admin/announcements/${anno.annoId}/edit`)">수정</button>
          <button class="btn-danger" @click="handleDelete">삭제</button>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.page-wrap { display: flex; flex-direction: column; gap: 20px; }
.empty-msg { text-align: center; padding: 60px 0; color: #aaa; font-size: 0.875rem; }
.detail-header {
  border-bottom: 2px solid #2d8659; padding-bottom: 14px;
  h2 { font-size: 1.1rem; font-weight: 700; margin: 8px 0 10px; }
  .meta { display: flex; gap: 16px; font-size: 0.8rem; color: #888; }
}
.badge {
  font-size: 0.75rem; padding: 2px 8px;
  background: #e8f4ee; color: #2d8659;
  border-radius: 10px; font-weight: 500;
}
.detail-body {
  min-height: 200px; font-size: 0.9rem; line-height: 1.7;
  white-space: pre-wrap; padding: 4px 0;
}
.btn-row { display: flex; gap: 8px; justify-content: flex-end; }
.btn-outline {
  padding: 7px 16px; border: 1px solid #ccc; border-radius: 6px;
  background: #fff; font-size: 0.875rem; cursor: pointer;
  &:hover { background: #f5f5f5; }
}
.btn-primary {
  padding: 7px 16px; background: #2d8659; color: #fff;
  border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer;
  &:hover { background: #246b47; }
}
.btn-danger {
  padding: 7px 16px; background: #e53935; color: #fff;
  border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer;
  &:hover { background: #c62828; }
}
</style>