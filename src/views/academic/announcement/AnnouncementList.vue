<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import AnnouncementService from '@/services/announcementService'
import Pagination from '@/components/common/Pagination.vue'

const router = useRouter()
const authStore = useAuthStore()

const annoList    = ref([])
const currentPage = ref(1)
const maxPage     = ref(1)
const isLoading   = ref(false)
const targetRole  = ref('')  // 관리자 필터용

const fetchList = async (page = 1) => {
    isLoading.value = true
    try {
        const params = { page, size: 10 }
        if (authStore.role === 'ADMIN' && targetRole.value) {
            params.targetRole = targetRole.value
        }
        const res = await AnnouncementService.getList(params)
        annoList.value    = res.content ?? []
        maxPage.value     = res.totalPages ?? 1
        currentPage.value = page
    } catch (e) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

const formatDate = (dateStr) => dateStr?.slice(0, 10) ?? ''

onMounted(() => fetchList(1))
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <h2>공지사항</h2>
      <div v-if="authStore.role === 'ADMIN'" class="filter-row">
        <select v-model="targetRole" @change="fetchList(1)">
          <option value="">전체</option>
          <option value="STUDENT">학생</option>
          <option value="PROFESSOR">교수</option>
          <option value="ALL">전체공개</option>
        </select>
        <button class="btn-primary" @click="router.push('/admin/announcements/create')">
          공지 등록
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="empty-msg">불러오는 중...</div>
    <div v-else-if="annoList.length === 0" class="empty-msg">공지사항이 없습니다.</div>
    <table v-else class="anno-table">
      <thead>
        <tr>
          <th>대상</th>
          <th>제목</th>
          <th>작성자</th>
          <th>조회수</th>
          <th>등록일</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="anno in annoList"
          :key="anno.annoId"
          class="clickable"
          @click="router.push(`/announcements/${anno.annoId}`)"
        >
          <td><span class="badge">{{ anno.targetRole }}</span></td>
          <td class="title-cell">{{ anno.title }}</td>
          <td>{{ anno.writerName }}</td>
          <td>{{ anno.viewCount }}</td>
          <td>{{ formatDate(anno.createdAt) }}</td>
        </tr>
      </tbody>
    </table>

    <Pagination
      v-if="maxPage > 1"
      :currentPage="currentPage"
      :maxPage="maxPage"
      @page-change="fetchList"
    />
  </div>
</template>

<style scoped lang="scss">
.page-wrap { display: flex; flex-direction: column; gap: 16px; }
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  h2 { font-size: 1.1rem; font-weight: 700; margin: 0; }
}
.filter-row { display: flex; gap: 8px; align-items: center; }
select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.875rem; }
.btn-primary {
  padding: 6px 14px; background: #2d8659; color: #fff;
  border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer;
  &:hover { background: #246b47; }
}
.empty-msg { text-align: center; padding: 60px 0; color: #aaa; font-size: 0.875rem; }
.anno-table {
  width: 100%; border-collapse: collapse; font-size: 0.875rem;
  th, td { padding: 10px 12px; border-bottom: 1px solid #eee; text-align: left; }
  th { background: #f7f9f8; font-weight: 600; }
  .clickable { cursor: pointer; &:hover { background: #f5f9f7; } }
  .title-cell { max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
.badge {
  font-size: 0.75rem; padding: 2px 8px;
  background: #e8f4ee; color: #2d8659;
  border-radius: 10px; font-weight: 500;
}
</style>