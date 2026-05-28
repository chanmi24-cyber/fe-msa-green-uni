<script setup>
import { reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import DataTable from '@/components/common/DataTable.vue';
import Pagination from '@/components/common/Pagination.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { APPROVAL_STATUS, STATUS_REQUEST_TYPE } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';
import { useListFilter } from '@/composables/useListFilter';

const router = useRouter();

const {
  filter, currentPage, pageSize, pageSizeOptions,
  hasFilter, onFilterChange, resetFilter, goToPage, onPageSizeChange, paginate,
} = useListFilter({ selectedYear: '' });

const state = reactive({ list: [], isLoading: false });
const hasPending = computed(() => state.list.some(i => i.status === 'PENDING'));

const yearOf = (item) => item.createdAt?.slice(0, 4);
const yearOptions = computed(() => [...new Set(state.list.map(yearOf).filter(Boolean))].sort().reverse());

const filteredList = computed(() =>
  state.list.filter(i => !filter.selectedYear || yearOf(i) === filter.selectedYear)
);
const { pagedList, maxPage } = paginate(filteredList);

const fetchList = async () => {
  state.isLoading = true;
  try {
    const res = await MemberService.findAllMyStatusRequests();
    state.list = res.data ?? [];
  } catch (err) {
    console.error('목록 로드 실패:', err);
  } finally {
    state.isLoading = false;
  }
};

const GRID_COLS = '1fr 1fr 80px 80px 1fr';

const goToDetail = (id) => {
  router.push({ path: `/members/status-request/${id}`, state: { hasPending: hasPending.value } });
};

onMounted(fetchList);
</script>

<template>
  <div style="position: relative;">
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

    <FilterBar :hasFilter="hasFilter" :show-search="false" @reset="resetFilter"
               :showCount="true" :count="filteredList.length"
               :showPageSize="true" v-model:pageSize="pageSize" :pageSizeOptions="pageSizeOptions"
               @pageSizeChange="onPageSizeChange">
      <div class="filter-item">
        <div class="input-label">신청 연도</div>
        <div class="input-content">
          <select v-model="filter.selectedYear" @change="onFilterChange">
            <option value="">전체</option>
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
          </select>
        </div>
      </div>
      <button v-if="!hasPending" class="btn btn-submit" @click="router.push('/members/status-request/new')">
        <font-awesome-icon icon="fa-solid fa-plus" /> 신청서 작성
      </button>
    </FilterBar>

    <DataTable
      :columns="['신청 유형', '신청일자', '학년', '학기', '상태']"
      :rows="pagedList"
      :gridCols="GRID_COLS"
      :isLoading="state.isLoading"
      emptyMessage="신청 내역이 없습니다."
    >
      <article class="tbl-row" v-for="item in pagedList" :key="item.requestId"
               @click="goToDetail(item.requestId)">
        <div>{{ STATUS_REQUEST_TYPE[item.type] ?? item.type }}</div>
        <div>{{ formatDateTime(item.createdAt) }}</div>
        <div>{{ item.academicYear }}학년</div>
        <div>{{ item.semester }}학기</div>
        <div>{{ APPROVAL_STATUS[item.status] ?? item.status }}</div>
      </article>
    </DataTable>

    <Pagination :currentPage="currentPage" :maxPage="maxPage" :pageGroupSize="10"
                @goToPage="goToPage" />

    <!-- 안내 패널 -->
    <div class="notice-panel card" style="margin-top: 16px;">
      <h3 class="notice-title">학적 변동 신청 안내</h3>
      <p class="notice-desc">
        휴학, 복학, 자퇴 신청서를 작성할 수 있습니다.<br />
        목록에서 신청 내역을 클릭하면 상세 내용을 확인할 수 있습니다.
      </p>
      <table class="notice-table">
        <colgroup>
          <col style="width: 72px" />
          <col />
        </colgroup>
        <tbody>
          <tr>
            <th>휴학</th>
            <td>복학 예정 연도·학기 입력이 필요합니다. 휴학 사유서를 첨부해 주세요.</td>
          </tr>
          <tr>
            <th>복학</th>
            <td>휴학 기간이 종료된 후 신청 가능합니다. 별도 서류는 필요하지 않습니다.</td>
          </tr>
          <tr>
            <th>자퇴</th>
            <td>자퇴 사유서를 첨부해 주세요.</td>
          </tr>
        </tbody>
      </table>
      <p class="notice-caution">대기 중인 신청서가 있는 경우 새로운 신청이 불가합니다.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tbl-row { cursor: pointer; }
</style>
