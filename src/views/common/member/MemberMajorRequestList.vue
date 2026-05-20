<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import DataTable from '@/components/common/DataTable.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useModalStore } from '@/stores/modal';
import { APPROVAL_STATUS } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';

const router = useRouter();
const modal = useModalStore();

const state = reactive({ list: [], isLoading: false });
const selectedId = ref(null);
const detail = reactive({ data: null, isLoading: false });

const GRID_COLS = '100px 1fr 1fr 100px';

const fetchList = async () => {
    state.isLoading = true;
    try {
        const res = await MemberService.findAllMyMajorRequest();
        state.list = res.data ?? [];
        console.log(res.data)
    } catch (err) {
        console.error('목록 로드 실패:', err);
    } finally {
        state.isLoading = false;
    }
};

const selectItem = async (item) => {
    if (selectedId.value === item.requestId) {
        selectedId.value = null;
        detail.data = null;
        return;
    }
    selectedId.value = item.requestId;
    detail.data = null;
    detail.isLoading = true;
    try {
        const res = await MemberService.findMyMajorRequest(item.requestId);
        detail.data = res.data;
    } catch (err) {
        console.error('상세 로드 실패:', err);
    } finally {
        detail.isLoading = false;
    }
};

const cancelRequest = async () => {
    const confirmed = await modal.showConfirm('신청을 취소하시겠습니까?', 'warning');
    if (!confirmed) return;
    try {
        await MemberService.cancelMajorRequest(detail.data.requestId);
        selectedId.value = null;
        detail.data = null;
        await fetchList();
        modal.showAlert('신청이 취소되었습니다.', 'success');
    } catch (err) {
        console.error('신청 취소 실패:', err);
        modal.showAlert('신청 취소에 실패했습니다.', 'error');
    }
};

const goToNew = () => router.push('/members/major-request/new');

onMounted(fetchList);
</script>

<template>
    <div style="position: relative;">
        <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

        <div class="list-detail-layout">
            <!-- 왼쪽: 목록 -->
            <div class="list-col">
                <DataTable :columns="['신청일', '유형', '대상학과', '상태']" :rows="state.list" :gridCols="GRID_COLS"
                    :isLoading="state.isLoading" emptyMessage="신청 내역이 없습니다.">
                    <article class="tbl-row" v-for="item in state.list" :key="item.requestId"
                        :class="{ 'row-selected': selectedId === item.requestId }" @click="selectItem(item)">
                        <div>{{ formatDateTime(item.createdAt) }}</div>
                        <div>{{ item.type }}</div>
                        <div>{{ item.targetMajorName }}</div>
                        <div>
                            <span class="status-badge">
                                {{ APPROVAL_STATUS[item.status] ?? item.status }}
                            </span>
                        </div>
                    </article>
                </DataTable>
                <p class="hint-text">※ 목록 클릭 시 상세 조회</p>
                <div class="list-footer">
                    <button class="btn btn-submit" @click="goToNew()">
                        <font-awesome-icon icon="fa-solid fa-plus" /> 신청서 작성
                    </button>
                </div>
            </div>

            <!-- 오른쪽: 상세 -->
            <div v-if="selectedId" class="detail-col">
                <LoadingSpinner v-if="detail.isLoading" :overlay="true" size="sm" />

                <template v-if="detail.data && !detail.isLoading">
                    <div class="detail-status">
                        <span class="status-badge">
                            {{ APPROVAL_STATUS[detail.data.status] ?? detail.data.status }}
                        </span>
                    </div>

                    <div class="info-wrap">
                        <div class="detail-row">
                            <dl>
                                <dt>신청일</dt>
                                <dd>{{ formatDateTime(detail.data.createdAt) }}</dd>
                            </dl>
                            <dl>
                                <dt>유형</dt>
                                <dd>{{ detail.data.type }}</dd>
                            </dl>
                        </div>
                        <div class="detail-row">
                            <dl class="w100p">
                                <dt>신청 사유</dt>
                                <dd class="reason-text">{{ detail.data.reason }}</dd>
                            </dl>
                        </div>
                        <div class="detail-row">
                            <dl>
                                <dt>첨부 파일</dt>
                                <dd>
                                    <a v-if="detail.data.fileUrl" :href="detail.data.fileUrl" target="_blank"
                                        class="file-link">
                                        {{ detail.data.fileName ?? '파일 다운로드' }}
                                    </a>
                                    <span v-else>-</span>
                                </dd>
                            </dl>
                        </div>
                    </div>

                    <!-- 반려: 반려 사유 + 재신청 -->
                    <template v-if="detail.data.status === '반려'">
                        <div class="reject-box">
                            <p class="reject-label">반려 사유</p>
                            <p class="reject-reason">{{ detail.data.rejectReason }}</p>
                        </div>
                        <div class="btn-row g10">
                            <button class="btn btn-submit" @click="goToNew()">재신청</button>
                        </div>
                    </template>

                    <!-- 대기: 수정 + 신청 취소 -->
                    <template v-else-if="detail.data.status === '대기'">
                        <div class="btn-row g10">
                            <button class="btn btn-register-del" @click="cancelRequest">신청 취소</button>
                        </div>
                    </template>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.hint-text {
    font-size: var(--text-xs);
    color: #aaa;
    margin: 6px 0 0;
}

.list-detail-layout {
    display: flex;
    gap: 20px;
    align-items: flex-start;
}

.list-col {
    flex: 1 1 auto;
    max-width: 480px;
}

.list-footer {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
}

.tbl-row {
    cursor: pointer;
    &.row-selected { background: var(--hover-bg-color) !important; }
}

.detail-col {
    flex: 1;
    position: relative;
    border: 1px solid var(--table-border-color);
    border-radius: 8px;
    padding: 24px;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 200px;
}

.detail-status {
    display: flex;
    justify-content: flex-end;
}

.detail-row {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
}

.reason-text {
    line-height: 1.6;
    white-space: pre-wrap;
}

.file-link {
    color: var(--main-color);
    text-decoration: underline;
}

.reject-box {
    padding: 14px 16px;
    background: var(--error-bg);
    border: 1px solid #f5c6c6;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.reject-label {
    font-weight: bold;
    font-size: var(--text-sm);
    color: var(--error);
}

.reject-reason {
    font-size: 14px;
    color: #555;
    line-height: 1.6;
}
</style>
