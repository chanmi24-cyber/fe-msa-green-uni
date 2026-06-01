<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GradeService from '@/services/gradeService'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()

// ── view 상태 ──────────────────────────────────────────────────────────────
const view         = ref('summary')  // 'summary' | 'list'
const activeStatus = ref('')         // 'PENDING' | 'REJECTED' | 'APPROVED'

// ── 요약 ───────────────────────────────────────────────────────────────────
const isSummaryLoading = ref(true)
const summary = ref({ pendingCount: 0, approvedCount: 0, rejectedCount: 0 })

// ── 목록 ───────────────────────────────────────────────────────────────────
const isListLoading = ref(false)
const appealList    = ref([])
const currentPage   = ref(1)
const maxPage       = ref(1)
const PAGE_SIZE     = 10

// ── 상태 메타 ──────────────────────────────────────────────────────────────
const STATUS_META = {
    PENDING:  { label: '대기',     countKey: 'pendingCount',  badgeClass: 'badge-pending',  theme: 'pending'  },
    REJECTED: { label: '반려',     countKey: 'rejectedCount', badgeClass: 'badge-rejected', theme: 'rejected' },
    APPROVED: { label: '처리완료', countKey: 'approvedCount', badgeClass: 'badge-approved', theme: 'approved' },
}
const currentMeta = () => STATUS_META[activeStatus.value] ?? {}

// ── 유틸 ───────────────────────────────────────────────────────────────────
const formatDate = (dt) => dt
    ? new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : '-'
const preview = (text) => text?.length > 15 ? text.slice(0, 15) + '…' : (text ?? '-')
const rowNum  = (idx)  => (currentPage.value - 1) * PAGE_SIZE + idx + 1

// ── API ────────────────────────────────────────────────────────────────────
const fetchSummary = async () => {
    isSummaryLoading.value = true
    try {
        summary.value = await GradeService.getProfessorAppealSummary()
    } catch {
    } finally {
        isSummaryLoading.value = false
    }
}

const fetchList = async (page = 1) => {
    isListLoading.value = true
    try {
        const res = await GradeService.getProfessorAppealList({ status: activeStatus.value, page, size: PAGE_SIZE })
        appealList.value  = res.content    ?? []
        maxPage.value     = res.totalPages ?? 1
        currentPage.value = page
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    } finally {
        isListLoading.value = false
    }
}

// ── 이벤트 ─────────────────────────────────────────────────────────────────
const openList = async (status) => {
    activeStatus.value = status
    view.value = 'list'
    await fetchList(1)
}

// 요약으로 돌아올 때 건수 재조회 (처리 후 변경 반영)
const backToSummary = async () => {
    view.value = 'summary'
    activeStatus.value = ''
    await fetchSummary()
}

onMounted(() => fetchSummary())
</script>

<template>
    <div style="position: relative;">

        <!-- ── 요약 뷰 ───────────────────────────────────────────────────── -->
        <template v-if="view === 'summary'">
            <LoadingSpinner v-if="isSummaryLoading" :overlay="true" size="md" />

            <div class="summary-grid">
                <div
                    v-for="({ label, countKey, theme }, status) in STATUS_META"
                    :key="status"
                    :class="['summary-box', `box-${theme}`]">
                    <div class="box-top">
                        <span class="box-title">이의신청 {{ label }}</span>
                        <p class="box-count">
                            {{ summary[countKey] }}<span class="box-unit">건</span>
                        </p>
                    </div>
                    <button :class="['box-btn', `btn-${theme}`]" @click="openList(status)">
                        확인하기
                    </button>
                </div>
            </div>
        </template>

        <!-- ── 목록 뷰 ───────────────────────────────────────────────────── -->
        <template v-else>
            <LoadingSpinner v-if="isListLoading" :overlay="true" size="md" />

            <div class="list-header-bar">
                <button class="btn-back" @click="backToSummary">← 목록으로</button>
                <h3 class="list-title">
                    이의신청
                    <span :class="['status-badge', currentMeta().badgeClass]">
                        {{ currentMeta().label }}
                    </span>
                </h3>
            </div>

            <DataTable
                :columns="['번호', '교과목명', '학생이름', '학년', '이의내용', '신청일', '열람']"
                :rows="appealList"
                gridCols="60px 2fr 90px 70px 2fr 110px 80px"
                :isLoading="isListLoading"
                emptyMessage="해당 이의신청 내역이 없습니다."
            >
                <article
                    v-for="(item, idx) in appealList"
                    :key="item.courseId"
                    class="tbl-row">
                    <div>{{ rowNum(idx) }}</div>
                    <div class="cell-left">{{ item.lectureName }}</div>
                    <div>{{ item.studentName ?? '-' }}</div>
                    <div>{{ item.academicYear != null ? item.academicYear + '학년' : '-' }}</div>
                    <div class="cell-left cell-muted">{{ preview(item.reason) }}</div>
                    <div>{{ formatDate(item.createdAt) }}</div>
                    <div>
                        <button class="btn-view"
                            @click.stop="router.push(`/professor/grades/appeals/${item.courseId}`)">
                            열람
                        </button>
                    </div>
                </article>
            </DataTable>

            <Pagination
                v-if="maxPage > 1"
                :currentPage="currentPage"
                :maxPage="maxPage"
                :pageGroupSize="10"
                @goToPage="fetchList"
            />
        </template>
    </div>
</template>

<style scoped lang="scss">
/* ── 요약 박스 ─────────────────────────────────────────────────────────── */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.summary-box {
    background: #fff;
    border: 1px solid var(--line-color);
    border-radius: 12px;
    padding: 24px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}
.box-pending  { border-left: 4px solid #e65100; }
.box-rejected { border-left: 4px solid #c62828; }
.box-approved { border-left: 4px solid #2e7d32; }

.box-top    { display: flex; flex-direction: column; gap: 8px; }
.box-title  { font-size: var(--text-sm); color: var(--font-color-light); font-weight: 600; }
.box-count  { font-size: 2rem; font-weight: 800; color: var(--font-color); line-height: 1; margin: 0; }
.box-unit   { font-size: 1rem; font-weight: 600; margin-left: 4px; }

.box-btn {
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
}
.btn-pending  { background: #fff3e0; color: #e65100; &:hover { background: #e65100; color: #fff; } }
.btn-rejected { background: #fce4e4; color: #c62828; &:hover { background: #c62828; color: #fff; } }
.btn-approved { background: #e8f5e9; color: #2e7d32; &:hover { background: #2e7d32; color: #fff; } }

/* ── 목록 헤더 ──────────────────────────────────────────────────────────── */
.list-header-bar {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
}
.btn-back {
    background: none;
    border: 1px solid var(--line-color);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: var(--text-xs);
    color: var(--font-color-light);
    cursor: pointer;
    white-space: nowrap;
    &:hover { color: var(--font-color); }
}
.list-title {
    font-size: 1.1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
}

.status-badge   { padding: 3px 10px; border-radius: 12px; font-size: 13px; font-weight: 700; }
.badge-pending  { background: #fff9c4; color: #e65100; }
.badge-rejected { background: #ffd0d0; color: #b71c1c; }
.badge-approved { background: #c8e6c9; color: #1b5e20; }

/* ── 테이블 행 ──────────────────────────────────────────────────────────── */
.cell-left  { justify-content: flex-start !important; text-align: left; padding-left: 14px !important; }
.cell-muted { color: var(--font-color-light); }

.btn-view {
    background: var(--main-color);
    color: #fff;
    border: none;
    border-radius: 5px;
    padding: 5px 12px;
    font-size: var(--text-xs);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    &:hover { filter: brightness(1.1); }
}
</style>
