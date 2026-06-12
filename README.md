# Green University 학사관리 시스템 - Frontend (MSA)

그린대학교(Green University) 학사관리 시스템 2차(MSA) 프로젝트의 프론트엔드 저장소입니다. 학생, 교수, 관리자 역할에 따라 회원, 학과, 강의, 수강신청, 출결(QR), 성적, 등록금, 장학금, 학사일정, 공지, 알림 화면을 제공합니다.

프로젝트 전체 소개, 시스템 아키텍처, 팀원 구성, 회고 등은 백엔드 저장소 README를 참고해 주세요.

> Backend: [be-msa-green-uni](https://github.com/green-uni/be-msa-green-uni)

<br>

## 기술 스택

| 구분 | 내용 |
|---|---|
| Core | Vue 3, Vite, Vue Router, Pinia (+ pinia-plugin-persistedstate) |
| HTTP | Axios |
| 스타일 | SCSS (Sass) |
| UI/UX | Font Awesome, VueUse, Swiper (배너), PWA |
| 캘린더 | FullCalendar (학사일정) |
| 실시간 통신 | STOMP, SockJS (WebSocket 알림) |
| QR | jsQR (스캔), qrcode.vue (생성) - QR 출결 |
| 차트 | Chart.js, vue-chartjs (성적/통계) |
| 엑셀 | xlsx (회원 일괄등록 등) |
| 코드 품질 | ESLint, Prettier |

<br>

## 폴더 구조

```
src/
├── assets/         # 이미지, 스타일(styles - SCSS)
├── components/     # 공통/도메인별 UI 컴포넌트 (announcement, auth, dashboard, member 등)
├── composables/    # Composition API 재사용 로직
├── layouts/        # 역할별 공통 레이아웃 (layouts/common)
├── router/         # Vue Router 설정 (routes 폴더로 역할별 라우트 분리)
├── services/       # Axios 기반 API 호출 함수
├── stores/         # Pinia 상태 관리
├── utils/          # 공통 유틸 함수
└── views/          # 화면 단위 컴포넌트
    ├── public/      # 비로그인 공개 화면 (공지)
    ├── common/      # 공통 화면 (로그인, 공통 강의/회원/학사일정)
    ├── academic/    # 학생/교수용 화면 (회원, 강의, 수강신청, 성적, 등록금, 장학금, 학사일정/공지/알림, 평가) - 프론트엔드 자체 네이밍
    ├── admin/       # 관리자용 화면 (회원, 강의, 학과, 공지, 등록금, 장학금)
    └── attendance/  # 출결 도메인 관련 화면 전체
```

<br>

## 실행 방법

### 1. 사전 요구사항
- Node.js (^20.19.0 또는 >=22.12.0)
- 백엔드 Gateway가 `localhost:8000`에서 실행 중이어야 합니다 (`/api`, `/file` 프록시 연동)

### 2. 설치 및 실행
```bash
git clone https://github.com/green-uni/fe-msa-green-uni.git
cd fe-msa-green-uni
npm install
npm run dev
```
개발 서버는 `0.0.0.0:5173`으로 실행되어, 같은 네트워크의 모바일 기기에서도 접속할 수 있습니다.

### 3. QR 출결(PWA) 테스트
QR 스캔 화면은 모바일 기기에서 접근해야 하므로, PC와 같은 네트워크의 IP 주소(`http://<PC IP>:5173`)로 접속하거나, ngrok 등 터널링 도메인을 `VITE_SCAN_BASE_URL` 환경변수로 설정해 사용합니다.

### 4. 기타 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 검사 및 자동 수정 |
| `npm run format` | Prettier 포맷팅 |
