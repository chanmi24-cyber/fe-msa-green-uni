<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import { useModalStore } from '@/stores/modal';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import StatusRequestDetail from '@/components/member/request/StatusRequestDetail.vue';
import { STATUS_LABEL } from '@/utils/constants';

const route = useRoute();
const router = useRouter();
const modal = useModalStore();

const requestId = route.params.requestId;
const request = ref(null);
const isLoading = ref(false);

const isPending = computed(() => request.value?.status === 'PENDING');

const actionMode = ref(null);
const note = ref('');
const rejectReason = ref('');

const openAction = (mode) => {
  actionMode.value = mode;
  note.value = '';
  rejectReason.value = '';
};
const closeAction = () => {
  actionMode.value = null;
  note.value = '';
  rejectReason.value = '';
};

const approve = async () => {
  const confirmed = await modal.showConfirm('이 신청서를 승인하시겠습니까?', 'success');
  if (!confirmed) return;
  try {
    await MemberService.processStatusRequest(requestId, {
      status: 'APPROVED',
      note: note.value.trim() || undefined,
    });
    await fetchRequest();
    closeAction();
    modal.showAlert('승인되었습니다.', 'success');
  } catch (err) {
    console.error('승인 실패:', err);
  }
};

const reject = async () => {
  if (!rejectReason.value.trim()) {
    modal.showAlert('반려 사유를 입력해주세요.', 'warning');
    return;
  }
  const confirmed = await modal.showConfirm('이 신청서를 반려하시겠습니까?', 'warning');
  if (!confirmed) return;
  try {
    await MemberService.processStatusRequest(requestId, {
      status: 'REJECTED',
      rejectReason: rejectReason.value,
    });
    await fetchRequest();
    closeAction();
    modal.showAlert('반려 처리되었습니다.', 'success');
  } catch (err) {
    console.error('반려 실패:', err);
  }
};

const downloadFile = async () => {
  try {
    await MemberService.downloadStatusRequestFile(requestId);
  } catch (err) {
    console.error('파일 다운로드 실패:', err);
  }
};

const goBack = () => {
  const { requestId: _, ...query } = route.query;
  router.push({ path: '/admin/members/status-request', query });
};

const fetchRequest = async () => {
  isLoading.value = true;
  try {
    const res = await MemberService.findStatusRequest(requestId);
    request.value = res.data ?? res;
  } catch (err) {
    console.error('신청서 로드 실패:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchRequest);
</script>

<template>
  <div class="detail-wrap">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

    <template v-if="!isLoading && request">

      <!-- 신청자 정보 -->
      <section class="card">
        <p class="card-label">신청자 정보</p>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-key">이름</span>
            <span class="info-val">{{ request.studentName }} ({{ request.memberCode }})</span>
          </div>
          <div class="info-item">
            <span class="info-key">학과</span>
            <span class="info-val">
              {{ request.currentMajorName ?? '-' }}
              <template v-if="request.currentMinorName"> / 부전공: {{ request.currentMinorName }}</template>
            </span>
          </div>
          <div class="info-item">
            <span class="info-key">학년/학기</span>
            <span class="info-val">{{ request.academicYear }}학년 {{ request.semester }}학기</span>
          </div>
          <div class="info-item">
            <span class="info-key">현재 학적</span>
            <span class="info-val">{{ STATUS_LABEL.STUDENT[request.academicStatus] ?? request.academicStatus ?? '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">취득 학점</span>
            <span class="info-val">{{ request.totalCredits ?? '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">연락처</span>
            <span class="info-val">{{ request.phone ?? '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">이메일</span>
            <span class="info-val">{{ request.email ?? '-' }}</span>
          </div>
        </div>
        <button class="btn btn-default history-btn"
          @click="router.push(`/admin/members/${request.memberCode}`)">
          변동 이력 보기
        </button>
      </section>

      <!-- 신청 내용 -->
      <StatusRequestDetail :request="request" @downloadFile="downloadFile" />

      <!-- 승인/반려 입력 박스 -->
      <div v-if="actionMode" class="action-box" :class="actionMode">
        <textarea v-if="actionMode === 'approve'" v-model="note" class="action-textarea"
          placeholder="승인 사유를 입력해주세요. (선택)" rows="3" />
        <textarea v-else v-model="rejectReason" class="action-textarea"
          placeholder="반려 사유를 입력해주세요." rows="3" />
        <div class="action-buttons">
          <button class="btn btn-default" @click="closeAction">취소</button>
          <button v-if="actionMode === 'approve'" class="btn btn-success" @click="approve">승인 처리</button>
          <button v-else class="btn btn-danger" @click="reject">반려 처리</button>
        </div>
      </div>

      <div class="page-footer">
        <button class="btn btn-default" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-list" /> 목록
        </button>
        <div v-if="isPending && !actionMode" class="action-group">
          <button class="btn btn-success" @click="openAction('approve')">승인</button>
          <button class="btn btn-danger" @click="openAction('reject')">반려</button>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped lang="scss">
.history-btn { width: 100%; margin-top: 16px; }
</style>
