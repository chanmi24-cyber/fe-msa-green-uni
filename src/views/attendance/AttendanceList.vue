<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useModalStore } from '@/stores/modal'
import attendanceService from '@/services/attendanceService.js'
import DataTable from '@/components/common/DataTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const modal  = useModalStore()

// ── 강의 목록 ──────────────────────────────────────────────────
const lectures         = ref([])
const isLectureLoading = ref(true)

// ── 강의 유형 / 강의실 헬퍼 ───────────────────────────────────
const LECTURE_TYPE = {
  GENERAL_REQUIRED: '교양필수', GENERAL_ELECTIVE: '교양선택',
  MAJOR_REQUIRED: '전공필수',   MAJOR_ELECTIVE: '전공선택',
}
const typeLabel = (code) => LECTURE_TYPE[code] ?? code

const scheduleText = (schedules) => {
  if (!schedules?.length) return '-'
  return schedules.map(s => `${s.dayOfWeek}요일 ${s.startPeriod}-${s.endPeriod}교시 · ${s.lectureRoom}`).join('\n')
}

// ── 현재 학기 판별 ────────────────────────────────────────────
const now             = new Date()
const currentYear     = now.getFullYear()
const currentSemester = now.getMonth() + 1 <= 6 ? 1 : 2
const isCurrent       = (lec) => lec.year === currentYear && lec.semester === currentSemester

onMounted(async () => {
  try {
    const res = await attendanceService.getProfessorLectures()
    lectures.value = res.data ?? res
  } finally {
    isLectureLoading.value = false
  }
})
</script>

<template>
  <div class="attendance-list-page">
    <LoadingSpinner v-if="isLectureLoading" :overlay="true" size="md" />

    <div class="list-header">
      <div class="list-header-box">
        <p>현재 학기 <strong>{{ currentYear }}</strong>년 <strong>{{ currentSemester }}</strong>학기</p>
      </div>
    </div>

    <DataTable
      :columns="['강의명', '유형', '학년도 / 학기', '학점 / 대상학년', '강의실']"
      :rows="lectures"
      gridCols="minmax(160px,2fr) minmax(80px,1fr) minmax(120px,1.2fr) minmax(110px,1fr) minmax(200px,2.5fr)"
      :isLoading="isLectureLoading"
      emptyMessage="담당 강의가 없습니다.">
      <article
        v-for="lec in lectures"
        :key="lec.lectureId"
        class="tbl-row pointer"
        :class="{ 'row--sample': !isCurrent(lec) }"
        @click="router.push(`/attendances/${lec.lectureId}/roster`)">
        <div>{{ lec.lectureName }}</div>
        <div>{{ typeLabel(lec.lectureType) }}</div>
        <div>{{ lec.year }}년 {{ lec.semester }}학기</div>
        <div>{{ lec.credit }}학점 / {{ lec.academicYear }}학년</div>
        <div class="pre-line">{{ scheduleText(lec.schedules) }}</div>
      </article>
    </DataTable>
  </div>
</template>

<style scoped lang="scss">
</style>