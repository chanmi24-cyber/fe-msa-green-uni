# 학사일정 기간 제한 UI 공통 패턴

학사일정에 따라 메뉴/기능 접근을 제한할 때 사용하는 공통 패턴입니다.

---

## 기간 확인 API

```js
import ScheduleService from '@/services/scheduleService';

const res = await ScheduleService.getActiveSchedules();
// 응답 예시: { LECTURE_REGISTRATION: true, LECTURE_EVALUATION: false, ... }
```

**EnumScheduleType 키 목록**

| 키 | 설명 |
|----|------|
| `LECTURE_REGISTRATION` | 강의개설신청 |
| `LECTURE_EVALUATION` | 강의평가 |
| `COURSE_REGISTRATION` | 수강신청 |
| `COURSE_MODIFICATION` | 수강정정 |
| `GRADE_INPUT` | 성적입력 |
| `GRADE_VIEW` | 성적조회 |
| `GRADE_APPEAL` | 성적이의신청 |
| `TUITION_PAYMENT` | 등록금납부 |
| `MAJOR_CHANGE` | 전과신청 |

---

## 패턴 1 — 전체 메뉴 차단

페이지 전체가 기간에 종속될 때 사용합니다. (예: 강의개설)

**기간이 아닌 경우** → 폼 대신 안내 문구만 표시, 이후 초기화 로직 실행하지 않음

### Script

```js
import ScheduleService from '@/services/scheduleService';

// isPeriod: true = 기간 O(정상), false = 기간 X(차단)
const isPeriod = ref(true);

onMounted(async () => {
  const res = await ScheduleService.getActiveSchedules();
  isPeriod.value = !!res.data?.data?.LECTURE_REGISTRATION; // 해당 키로 변경
  if (!isPeriod.value) return; // 기간 아니면 이후 초기화 로직 실행 안 함

  // 나머지 초기화 로직...
});
```

### Template

```html
<div v-if="!isPeriod" class="empty-period">강의개설 기간이 아닙니다.</div>
<div class="form-wrap" v-else>
  <!-- 기존 페이지 내용 -->
</div>
```

### STYLE

```css
.empty-period {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
  font-size: 18px;
  color: #999;
}
```

---

## 패턴 2 — 부분 차단

목록은 보여주되 특정 액션(버튼, 폼 등)만 막을 때 사용합니다. (예: 강의평가)

**기간이 아닌 경우** → 목록은 정상 노출, 액션 영역만 안내 문구로 대체

### Script

```js
import ScheduleService from '@/services/scheduleService';

const isPeriod = ref(true);

onMounted(async () => {
  const res = await ScheduleService.getActiveSchedules();
  isPeriod.value = !!res.data?.data?.LECTURE_EVALUATION; // 해당 키로 변경
  // return 없음 — 목록 로딩은 계속 진행
  await fetchList();
});
```

### Template

```html
<!-- 목록은 항상 표시 -->
<div class="list">...</div>

<!-- 액션 영역만 조건 분기 -->
<template v-if="!isPeriod">
  <p class="empty-text">강의평가 기간이 아닙니다.</p>
</template>
<template v-else>
  <!-- 평가 작성 폼 등 액션 UI -->
</template>
```

---

## 요약

| 구분 | `isPeriod` 기본값 | `onMounted` 처리 | Template 분기 위치 |
|------|:-----------------:|------------------|-------------------|
| 전체 차단 | `true` | 기간 X이면 `return`으로 중단 | 페이지 최상단 |
| 부분 차단 | `true` | `return` 없이 목록 로딩 계속 | 액션 블록 내부 |

> **주의:** `isPeriod`의 기본값은 `true`입니다. API 응답 전에 폼이 잠깐 보이는 것을 허용하되, 응답 후 즉시 반영됩니다. 로딩 처리가 필요하다면 별도의 `isLoading` ref를 추가하세요.
