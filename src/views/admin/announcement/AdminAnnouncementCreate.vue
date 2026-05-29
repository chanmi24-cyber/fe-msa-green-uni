<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import AnnouncementService from '@/services/announcementService'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const annoId = computed(() => route.params.annoId)
const isEdit = computed(() => !!annoId.value)

const form = ref({
    targetRole: 'STUDENT',
    title:      '',
    content:    '',
})
const isLoading = ref(false)

onMounted(async () => {
    if (isEdit.value) {
        try {
            const detail = await AnnouncementService.getDetail(annoId.value)
            form.value.targetRole = detail.targetRole
            form.value.title      = detail.title
            form.value.content    = detail.content
        } catch (e) {
            console.error(e)
        }
    }
})

const handleSubmit = async () => {
    if (!form.value.title.trim() || !form.value.content.trim()) {
        alert('제목과 내용을 입력해주세요.')
        return
    }
    isLoading.value = true
    try {
        if (isEdit.value) {
            await AnnouncementService.update(annoId.value, {
                title:   form.value.title,
                content: form.value.content,
            })
        } else {
            await AnnouncementService.create({
                targetRole: form.value.targetRole,
                title:      form.value.title,
                content:    form.value.content,
                writerName: authStore.name,
            })
        }
        router.push('/admin/announcements')
    } catch (e) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <h2>{{ isEdit ? '공지사항 수정' : '공지사항 등록' }}</h2>
    </div>

    <form class="form-wrap" @submit.prevent="handleSubmit">
      <div class="form-row">
        <label>대상</label>
        <select v-model="form.targetRole" :disabled="isEdit">
          <option value="STUDENT">학생</option>
          <option value="PROFESSOR">교수</option>
          <option value="ALL">전체공개</option>
        </select>
      </div>
      <div class="form-row">
        <label>제목</label>
        <input
          v-model="form.title"
          type="text"
          maxlength="50"
          placeholder="제목을 입력하세요 (최대 50자)"
        />
      </div>
      <div class="form-row align-top">
        <label>내용</label>
        <textarea
          v-model="form.content"
          rows="12"
          placeholder="내용을 입력하세요"
        />
      </div>

      <div class="btn-row">
        <button type="button" class="btn-outline" @click="router.back()">취소</button>
        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isEdit ? '수정 완료' : '등록' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss">
.page-wrap { display: flex; flex-direction: column; gap: 20px; }
.page-header h2 { font-size: 1.1rem; font-weight: 700; margin: 0; }
.form-wrap { display: flex; flex-direction: column; gap: 16px; }
.form-row {
  display: flex; align-items: center; gap: 16px;
  &.align-top { align-items: flex-start; }
  label { width: 60px; font-size: 0.875rem; font-weight: 600; flex-shrink: 0; }
  select, input, textarea {
    flex: 1; padding: 8px 12px;
    border: 1px solid #ddd; border-radius: 6px;
    font-size: 0.875rem; font-family: inherit;
    &:focus { outline: none; border-color: #2d8659; }
  }
  textarea { resize: vertical; line-height: 1.6; }
  select:disabled { background: #f5f5f5; color: #888; }
}
.btn-row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
.btn-outline {
  padding: 8px 20px; border: 1px solid #ccc; border-radius: 6px;
  background: #fff; font-size: 0.875rem; cursor: pointer;
  &:hover { background: #f5f5f5; }
}
.btn-primary {
  padding: 8px 20px; background: #2d8659; color: #fff;
  border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer;
  &:disabled { background: #aaa; cursor: not-allowed; }
  &:not(:disabled):hover { background: #246b47; }
}
</style>