<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useModalStore } from '@/stores/modal'
import attendanceService from '@/services/attendanceService.js'
import CalendarDate from '@/components/util/CalendarDate.vue'
import DataTable from '@/components/common/DataTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Pagination from '@/components/common/Pagination.vue'

const modal = useModalStore()

// ── 강의 목록 ──────────────────────────────────────────────────
const lectures         = ref([])
const isLectureLoading = ref(true)
const selectedLecture  = ref(null)

// ── 날짜 필터 ──────────────────────────────────────────────────
const selectedDate   = ref(today())
const recordedDates  = ref([])

// ── 출석부 ────────────────────────────────────────────────────
const roster          = ref([])
const isRosterLoading = ref(false)
const isEditMode      = ref(false)
const isSaving        = ref(false)

// ── 페이징 ────────────────────────────────────────────────────
const PAGE_SIZE   = 10
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(roster.value.length / PAGE_SIZE))

const pagedRoster = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return roster.value.slice(start, start + PAGE_SIZE)
})

const ATTEND_KEY   = computed(() => `attendance_${selectedLecture.value?.lectureId}_${selectedDate.value}`)
const LAST_EDIT_KEY = computed(() => `attendance_last_edit_${selectedLecture.value?.lectureId}`)

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

// ── 출석 상태 ─────────────────────────────────────────────────
const STATUS_LABEL = { ATTEND: '출석', ABSENT: '결석', LATE: '지각', EARLY_LEAVE: '조퇴' }
const STATUS_CLASS = { ATTEND: 'text-attend', ABSENT: 'text-absent', LATE: 'text-late', EARLY_LEAVE: 'text-early-leave' }

const statusLabel = (code) => STATUS_LABEL[code] ?? code
const statusClass = (code) => STATUS_CLASS[code] ?? ''

// ── 로직 ──────────────────────────────────────────────────────
watch([selectedLecture, selectedDate], async ([newLec, newDate], [oldLec]) => {
  if (!newLec) return
  isEditMode.value = false
  if (newLec?.lectureId !== oldLec?.lectureId) await loadRecordedDates()
  await loadRoster()
})

onMounted(async () => {
  try {
    const res = await attendanceService.getProfessorLectures()
    lectures.value = res.data ?? res
  } finally {
    isLectureLoading.value = false
  }
})

function openRoster(lec) {
  selectedLecture.value = lec
  isEditMode.value = false
  roster.value = []
  recordedDates.value = []
  const lastDate = localStorage.getItem(`attendance_last_edit_${lec.lectureId}`)
  selectedDate.value = lastDate ?? today()
}

function closeRoster() {
  selectedLecture.value = null
  isEditMode.value = false
  roster.value = []
  recordedDates.value = []
}

async function loadRecordedDates() {
  if (!selectedLecture.value) return
  try {
    const res = await attendanceService.getRecordedDates(selectedLecture.value.lectureId)
    recordedDates.value = res.data ?? res
  } catch (e) {
    console.error('날짜 목록 조회 실패', e)
  }
}

async function loadRoster() {
  if (!selectedLecture.value) return
  roster.value = []
  isEditMode.value = false
  isRosterLoading.value = true
  currentPage.value = 1
  try {
    const res = await attendanceService.getAttendanceList(selectedLecture.value.lectureId, selectedDate.value)
    const data = res.data ?? res
    const draft = localStorage.getItem(ATTEND_KEY.value)
    if (draft) {
      const isConfirm = await modal.showConfirm('기존에 수정 중이던 내용을 불러오시겠습니까?', 'info')
      if (isConfirm) {
        const draftList = JSON.parse(draft)
        roster.value = data.map(row => {
          const saved = draftList.find(d => d.studentCode === row.studentCode)
          return saved ? { ...row, status: saved.status, reason: saved.reason } : row
        })
        isEditMode.value = true
      } else {
        localStorage.removeItem(ATTEND_KEY.value)
        localStorage.removeItem(LAST_EDIT_KEY.value)
        roster.value = data
      }
    } else {
      roster.value = data
    }
  } catch (e) {
    console.error('[loadRoster] 출석부 조회 실패:', e?.response?.data ?? e)
  } finally {
    isRosterLoading.value = false
  }
}

function saveDraft() {
  localStorage.setItem(ATTEND_KEY.value, JSON.stringify(roster.value))
  localStorage.setItem(LAST_EDIT_KEY.value, selectedDate.value)
}

async function cancelEditMode() {
  localStorage.removeItem(ATTEND_KEY.value)
  localStorage.removeItem(LAST_EDIT_KEY.value)
  isEditMode.value = false
  await loadRoster()
}

async function saveAttendance() {
  const confirm = await modal.showConfirm(`${selectedDate.value} 출석 정보를 저장하시겠습니까?`, 'info')
  if (!confirm) return
  isSaving.value = true
  try {
    const updates = roster.value
      .filter(row => row.attendId !== null)
      .map(row => ({ attendId: row.attendId, status: row.status, reason: row.reason || null }))
    await attendanceService.updateAttendStatuses(selectedLecture.value.lectureId, updates)
    localStorage.removeItem(ATTEND_KEY.value)
    localStorage.removeItem(LAST_EDIT_KEY.value)
    await loadRoster()
    await loadRecordedDates()
    await modal.showAlert(`${selectedDate.value} 출석 정보가 저장되었습니다.`, 'success')
    isEditMode.value = false
  } catch (e) {
    console.error('저장 실패', e)
    await modal.showAlert('출석 저장에 실패했습니다.', 'error')
  } finally {
    isSaving.value = false
  }
}

const goToPage = (page) => { currentPage.value = page }

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="attendance-list-page">

    <!-- ── View 1: 강의 목록 ────────────────────────────────── -->
    <template v-if="!selectedLecture">
      <LoadingSpinner v-if="isLectureLoading" :overlay="true" size="md" />

      <DataTable
        :columns="['강의명', '유형', '학년도 / 학기', '학점 / 대상학년', '강의실']"
        :rows="lectures"
        gridCols="minmax(160px,2fr) minmax(80px,1fr) minmax(120px,1.2fr) minmax(110px,1fr) minmax(200px,2.5fr)"
        :isLoading="isLectureLoading"
        emptyMessage="담당 강의가 없습니다."
        class="lecture-table">
        <article
          v-for="lec in lectures"
          :key="lec.lectureId"
          class="tbl-row pointer"
          @click="openRoster(lec)">
          <div class="tal">{{ lec.lectureName }}</div>
          <div>{{ typeLabel(lec.lectureType) }}</div>
          <div>{{ lec.year }}년 {{ lec.semester }}학기</div>
          <div>{{ lec.credit }}학점 / {{ lec.academicYear }}학년</div>
          <div class="tal" style="white-space: pre-line">{{ scheduleText(lec.schedules) }}</div>
        </article>
      </DataTable>
    </template>

    <!-- ── View 2: 출석부 ─────────────────────────────────── -->
    <template v-else>

      <!-- 헤더 -->
      <div class="page-header">
        <button class="btn btn-default" @click="closeRoster">← 강의 목록</button>
        <h2 style="flex: 1; margin-left: 12px">{{ selectedLecture.lectureName }}</h2>
      </div>

      <!-- 날짜 선택 + 액션 버튼 -->
      <div class="date-bar">
        <div class="date-picker-wrap">
          <label class="date-label">수업 날짜</label>
          <CalendarDate v-model="selectedDate" :highlightedDates="recordedDates" />
        </div>
        <div class="action-btns" v-if="roster.length > 0">
          <button v-if="!isEditMode" class="btn btn-default" @click="isEditMode = true">수정</button>
          <template v-else>
            <button class="btn btn-submit" :disabled="isSaving" @click="saveAttendance">저장</button>
            <button class="btn btn-default" @click="cancelEditMode">취소</button>
          </template>
        </div>
        <span v-if="!isRosterLoading && roster.length === 0" class="notice-caution">
          선택한 날짜에 출석 기록이 없습니다.
        </span>
      </div>

      <!-- 출석부 테이블 -->
      <DataTable
        :columns="['학년', '학과', '이름', '출결 상태', '비고']"
        :rows="roster"
        gridCols="0.8fr 1.8fr 1fr 2.5fr 2fr"
        :isLoading="isRosterLoading"
        emptyMessage="선택한 날짜에 출석 기록이 없습니다."
        class="roster-table">
        <article v-for="row in pagedRoster" :key="row.studentCode" class="tbl-row">
          <div>{{ row.academic_year != null ? row.academic_year + '학년' : '-' }}</div>
          <div>{{ row.major_name ?? '-' }}</div>
          <div>{{ row.memberName }}</div>
          <div>
            <template v-if="!isEditMode">
              <span :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
            </template>
            <template v-else>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.studentCode" value="ATTEND"
                    v-model="row.status" @change="saveDraft" /> 출석
                </label>
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.studentCode" value="LATE"
                    v-model="row.status" @change="saveDraft" /> 지각
                </label>
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.studentCode" value="ABSENT"
                    v-model="row.status" @change="saveDraft" /> 결석
                </label>
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.studentCode" value="EARLY_LEAVE"
                    v-model="row.status" @change="saveDraft" /> 조퇴
                </label>
              </div>
            </template>
          </div>
          <div>
            <template v-if="!isEditMode">
              <span class="no-data">{{ row.reason ?? '-' }}</span>
            </template>
            <input v-else type="text" v-model="row.reason" @input="saveDraft"
              placeholder="사유 입력" class="tbl-input" />
          </div>
        </article>
      </DataTable>

      <!-- 하단 페이지네이션 -->
      <div class="roster-footer">
        <Pagination v-if="totalPages > 1"
          :currentPage="currentPage" :maxPage="totalPages" :pageGroupSize="10"
          @goToPage="goToPage" />
        <p v-if="roster.length > 0" class="roster-count">
          총 {{ roster.length }}명 중
          {{ (currentPage - 1) * PAGE_SIZE + 1 }}~{{ Math.min(currentPage * PAGE_SIZE, roster.length) }}명 표시
        </p>
      </div>

    </template>
  </div>
</template>

<style scoped lang="scss">
.attendance-list-page {
  width: 100%;
  padding: 28px var(--size-df);
  overflow: visible;
  position: relative;
}

/* 달력 팝업이 테이블 뒤로 숨지 않도록 */
.date-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  position: relative;
  z-index: 50;
}
.date-picker-wrap { display: flex; align-items: center; gap: 12px; }
.date-label       { font-size: 0.875em; font-weight: 600; }
.action-btns      { display: flex; gap: 8px; margin-left: 8px; }

/* 최소 높이 고정 (인원 적어도 레이아웃 안정) */
.lecture-table,
.roster-table {
  min-height: 460px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  :deep(.tbl-wrap) { overflow: visible !important; }
}

/* 수정 모드 라디오 — 전역 _form.scss radio-label과 충돌하여 scoped 유지 */
.radio-group { display: flex; gap: 14px; font-size: 0.875em; flex-wrap: wrap; justify-content: flex-start; }
.radio-label {
  cursor: pointer; display: flex; align-items: center; gap: 4px;
  padding-left: 0;
  input[type='radio'] { display: inline-block; width: 14px; height: 14px; accent-color: $green-600; }
  &:nth-of-type(1):has(input:checked) { color: $green-600; }
  &:nth-of-type(2):has(input:checked) { color: #f57f17; }
  &:nth-of-type(3):has(input:checked) { color: #d32f2f; }
  &:nth-of-type(4):has(input:checked) { color: #e65100; }
}

/* 하단 푸터 */
.roster-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}
.roster-count {
  margin-top: 8px;
  font-size: 0.75em;
  color: $font-color-light;
}
</style>
