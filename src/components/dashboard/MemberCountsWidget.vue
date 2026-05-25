<script setup>
import { ref, onMounted } from 'vue'
import memberService from '@/services/memberService'

const counts = ref({ studentCount: 0, professorCount: 0, adminCount: 0 })

onMounted(async () => {
  try {
    const res = await memberService.getDashboardCounts()
    counts.value = res.data ?? counts.value
  } catch (e) {
    console.error('계정 현황 조회 실패', e)
  }
})
</script>

<template>
  <div class="counts-grid">
    <div class="count-card content-wrap">
      <span class="count-label student-accent">학생</span>
      <span class="count-num">{{ Number(counts.studentCount).toLocaleString() }}<em>명</em></span>
    </div>
    <div class="count-card content-wrap">
      <span class="count-label professor-accent">교수</span>
      <span class="count-num">{{ Number(counts.professorCount).toLocaleString() }}<em>명</em></span>
    </div>
    <div class="count-card content-wrap">
      <span class="count-label admin-accent">관리자</span>
      <span class="count-num">{{ Number(counts.adminCount).toLocaleString() }}<em>명</em></span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.counts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.count-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 1.25rem 1.5rem;
}

.count-label {
  font-size: 0.929em; // 13px / 14px
  font-weight: 600;
  padding-left: 10px;
  border-left: 3px solid currentColor;

  &.student-accent   { color: $green-600; }
  &.professor-accent { color: $info; }
  &.admin-accent     { color: #9b59b6; }
}

.count-num {
  font-size: 1.714em; // 24px / 14px
  font-weight: 700;
  color: $font-color;
  line-height: 1;

  em {
    font-size: 0.6em;
    font-weight: 400;
    color: $font-color-light;
    margin-left: 2px;
    font-style: normal;
  }
}
</style>
