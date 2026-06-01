<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GradeService from '@/services/gradeService'
import DataTable from '@/components/common/DataTable.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()

const allLectures = ref([])
const isLoading = ref(true)
const currentPage = ref(1)
const PAGE_SIZE = 10

const filter = reactive({ year: '', semester: '' })
const searchQuery = ref('')
const searchInput = ref('')

// 보유 강의에서 연도 옵션 추출 (최신순)
const yearOptions = computed(() =>
    [...new Set(allLectures.value.map(l => l.year))].sort((a, b) => b - a)
)

const filteredList = computed(() => {
    const keyword = searchInput.value.toLowerCase()
    return allLectures.value.filter(l => {
        if (filter.year     && l.year     !== Number(filter.year))     return false
        if (filter.semester && l.semester !== Number(filter.semester)) return false
        if (keyword         && !l.lectureName.toLowerCase().includes(keyword)) return false
        return true
    })
})

const maxPage = computed(() => Math.max(1, Math.ceil(filteredList.value.length / PAGE_SIZE)))
const pagedList = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return filteredList.value.slice(start, start + PAGE_SIZE)
})

const onFilterChange = () => { currentPage.value = 1 }
const onSearch = () => { searchInput.value = searchQuery.value; currentPage.value = 1 }
const goToPage = (page) => { currentPage.value = page }

onMounted(async () => {
    try {
        allLectures.value = await GradeService.getProfessorLectures()
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div style="position: relative;">
        <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

        <FilterBar
            placeholder="강의명을 입력하세요"
            :showCount="true"
            :count="filteredList.length"
            v-model:searchQuery="searchQuery"
            @search="onSearch"
        >
            <div class="filter-item">
                <div class="input-label">연도</div>
                <div class="input-content">
                    <select v-model="filter.year" @change="onFilterChange">
                        <option value="">전체</option>
                        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
                    </select>
                </div>
            </div>
            <div class="filter-item">
                <div class="input-label">학기</div>
                <div class="input-content">
                    <select v-model="filter.semester" @change="onFilterChange">
                        <option value="">전체</option>
                        <option :value="1">1학기</option>
                        <option :value="2">2학기</option>
                    </select>
                </div>
            </div>
        </FilterBar>

        <DataTable
            :columns="['이수구분', '강의명', '학년도', '학기', '학점', '대상학년', '관리']"
            :rows="pagedList"
            gridCols="100px 3fr 80px 70px 70px 80px 110px"
            :isLoading="isLoading"
            emptyMessage="담당 중인 강의가 없습니다."
        >
            <article
                v-for="lecture in pagedList"
                :key="lecture.lectureId"
                class="tbl-row">
                <div>{{ lecture.lectureType }}</div>
                <div>{{ lecture.lectureName }}</div>
                <div>{{ lecture.year }}년</div>
                <div>{{ lecture.semester }}학기</div>
                <div>{{ lecture.credit }}학점</div>
                <div>{{ lecture.academicYear }}학년</div>
                <div>
                    <button class="btn btn-submit"
                        @click.stop="router.push(`/professor/grades/${lecture.lectureId}`)">
                        성적 관리
                    </button>
                </div>
            </article>
        </DataTable>

        <Pagination
            v-if="maxPage > 1"
            :currentPage="currentPage"
            :maxPage="maxPage"
            :pageGroupSize="10"
            @goToPage="goToPage"
        />
    </div>
</template>

<style scoped lang="scss">

.btn-submit {
    background: $green-600;
    color: #fff;
    border: 1px solid $green-600;
    font-size: $fs-xs;
    padding: 6px 14px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 600;
    white-space: nowrap;
    transition: all 0.2s;
    &:hover { filter: brightness(1.1); }
}
</style>
