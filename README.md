# DKO 디케이오 — 대가리 깨져도 오버워치

오버워치 크루 DKO의 모바일 웹앱이에요. 만든 곳: THRE3RIC STUDIO

## 폴더 구성

| 파일 | 설명 |
|---|---|
| `index.html` | 앱 전체 (이 파일 하나로 동작해요) |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png` | 홈 화면 아이콘 · 앱 설치 정보 |
| `firebase/firestore.rules` | Firestore 보안 규칙 |
| `firebase/database.rules.json` | Realtime Database 보안 규칙 (DKO 타운) |
| `firebase.json`, `.firebaserc` | Firebase Hosting으로 올릴 때 쓰는 설정 |

Firebase 연결 정보는 `index.html` 안의 `window.DKO_CONFIG`에 이미 들어 있어요.
입금 계좌는 같은 곳의 `PAY: { bank: "", account: "", holder: "트릭이" }`를 채우면 돼요.

---

## 1. GitHub에 올리기 (GitHub Pages)

1. GitHub에서 **New repository**를 누르고 이름을 정해요. 예: `dko`
   - 무료 계정은 **Public**이어야 Pages를 쓸 수 있어요.
   - Firebase 설정값이 공개돼도 괜찮아요. 데이터는 보안 규칙으로 지켜져요.
2. 저장소 화면에서 **Add file → Upload files**를 누르고, 이 폴더의 파일을 전부 끌어다 놓은 뒤 **Commit**해요.
   - `.firebaserc`처럼 점으로 시작하는 파일은 안 보일 수 있는데, Pages에는 없어도 돼요.
3. **Settings → Pages**에서 Source를 `Deploy from a branch`로, Branch를 `main` / `/ (root)`로 고르고 **Save**해요.
4. 1~2분 뒤 `https://아이디.github.io/dko/` 주소로 열려요.

앱을 고친 뒤에는 `index.html`만 다시 업로드하면 돼요.

---

## 2. Firebase 콘솔 설정 (한 번만)

<https://console.firebase.google.com> → 프로젝트 **overwatche3-6508d**

### ① Authentication — 로그인 방법
- **Authentication → 로그인 방법(Sign-in method)**
  - **이메일/비밀번호: 사용 설정.** 닉네임 로그인이 내부적으로 이 방식을 써요.
  - **Google: 사용 설정.** 프로젝트 지원 이메일을 고르고 저장해요.
- **Authentication → 설정 → 승인된 도메인**에서 **도메인 추가**를 누르고 아래를 넣어요.
  - `아이디.github.io` (GitHub Pages 주소, 저장소 이름은 빼고)
  - Firebase Hosting을 쓰면 `overwatche3-6508d.web.app`, `overwatche3-6508d.firebaseapp.com`도 있는지 확인해요. 보통 기본으로 들어 있어요.

### ② Firestore Database — 채팅 · 회원 · 패스 데이터
1. **Firestore Database → 데이터베이스 만들기**를 눌러요.
   - 위치: `asia-northeast3 (서울)`
   - 모드: **프로덕션 모드**
2. **규칙** 탭에 `firebase/firestore.rules` 내용을 통째로 붙여 넣고 **게시**해요.
3. 따로 만들 색인(인덱스)은 없어요.

### ③ Realtime Database — DKO 타운 실시간 위치 · 감정 표현
1. 이미 만들어져 있어요 (`asia-southeast1`).
2. **규칙** 탭에 `firebase/database.rules.json` 내용을 붙여 넣고 **게시**해요.

### ④ 관리자 계정
- 운영진 권한은 **관리자 전용 계정**에만 있어요. 아이디 `superthre3ric`, 첫 로그인 비밀번호 `123`으로 들어가면 계정이 자동으로 만들어져요.
- 배포하자마자 **가장 먼저** 이 계정으로 로그인하고, 설정 → 비밀번호 바꾸기로 바꿔 주세요. 저장소가 공개라 아이디와 첫 비밀번호를 누구나 볼 수 있어요.
- 야건 · 트릭이 계정은 크루장 · 운영진 표시만 남고 일반 크루원 권한이 돼요. 관리자 계정은 프로필에서 다른 크루원에게 관리자 권한을 줄 수 있어요.

### ⑤ 첫 접속
- **운영진(트릭이 · 야건):** 닉네임과 초기 비밀번호 `0000`으로 들어가서 새 비밀번호를 정해요.
- **크루원:** 오버워치 닉네임으로 가입하거나 Google로 계속하기를 눌러요. Google은 처음 한 번 닉네임을 정해요.

### (선택) API 키 보호
Google Cloud 콘솔 → API 및 서비스 → 사용자 인증 정보 → 브라우저 키에서 **HTTP 리퍼러**로 아래만 허용하면 더 안전해요.
- `아이디.github.io/*`
- `overwatche3-6508d.web.app/*`

---

## 3. 앱 아이콘 (홈 화면에 추가)

- **아이폰:** Safari로 앱 주소를 열고 **공유 → 홈 화면에 추가**를 눌러요. DKO 로고 아이콘과 `DKO` 이름으로 생겨요.
  - 예전 아이콘이 있다면 지우고 다시 추가해야 새 로고로 바뀌어요.
- **안드로이드:** Chrome 메뉴(⋮) → **앱 설치** 또는 **홈 화면에 추가**를 눌러요.
- 홈 화면에서 열면 주소창 없이 앱처럼 열리고, 처음 열 때와 오랜만에 열 때 THRE3RIC 인트로가 나와요.

---

## 4. 구글 로그인 — "The requested action is invalid" 해결

원인: 앱을 연 주소(`github.io`)와 로그인 처리 주소(`firebaseapp.com`)가 달라서, 아이폰(특히 홈 화면 앱)이 로그인 결과를 앱으로 못 돌려줘요. **공식 주소를 Firebase Hosting으로 바꾸면 해결돼요.** v20.1부터 앱이 휴대폰에서는 자동으로 같은 주소 방식(리디렉트)으로 로그인해요.

1. **Firebase Hosting에 올리기** (아래 "Firebase Hosting으로 올리기"). 주소: `https://overwatche3-6508d.web.app`
2. **Google Cloud 콘솔 → API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID "Web client (auto created by Google Service)"** 를 열고
   - 승인된 JavaScript 원본: `https://overwatche3-6508d.web.app`
   - 승인된 리디렉션 URI: `https://overwatche3-6508d.web.app/__/auth/handler`
   를 추가하고 저장해요. (5분쯤 걸려요. 안 하면 `redirect_uri_mismatch` 오류가 나요)
3. Firebase 콘솔 → Authentication → 로그인 방법 → **Google 사용 설정** + 프로젝트 지원 이메일 선택.
4. Authentication → 설정 → **승인된 도메인**에 `overwatche3-6508d.web.app` 이 있는지 확인 (기본으로 있어요).
5. 아이폰 홈 화면의 예전 DKO 아이콘은 지우고, **Safari로 `overwatche3-6508d.web.app` 을 열어 홈 화면에 다시 추가**해요. 크루원들에게도 이 주소를 알려 주세요.
6. 카카오톡 · 인스타그램 링크로 열면 구글이 로그인을 막아요. 로그인 화면에 나오는 **"Safari · Chrome으로 열기"** 를 눌러요.

`github.io` 주소에서도 PC 브라우저 구글 로그인과 닉네임 로그인은 계속 돼요. 휴대폰에서 구글 로그인을 누르면 공식 주소로 안내해요.

### Firebase Hosting으로 올리기
PC에 Node.js(LTS)를 설치하고, 이 폴더(index.html이 있는 곳)에서 터미널을 열어 실행해요.

```
npm install -g firebase-tools
firebase login
firebase deploy --only hosting,firestore:rules,database
```
`.firebaserc` 에 프로젝트(overwatche3-6508d)가 이미 적혀 있어요. 업데이트할 때마다 새 index.html을 넣고 `firebase deploy --only hosting` 만 다시 하면 돼요.

## 5. 푸시 알림 (앱을 닫아도 폰으로 오는 알림)

필요한 것 3가지: ① 서버 푸시 키(VAPID) ② 알림을 보내는 함수(dkoPush) ③ 폰에서 알림 켜기

**① 서버 푸시 키** — Firebase 콘솔 → ⚙ 프로젝트 설정 → **클라우드 메시징** 탭 → 맨 아래 "웹 구성 · 웹 푸시 인증서" → **키 쌍 생성** → 나온 키(B로 시작, 87자쯤)를 복사.
관리자 계정으로 앱에 로그인 → **설정 → 푸시 알림 → 운영진: 서버 푸시 키 → 키 넣기**에 붙여 넣고 저장. (index.html을 고칠 필요 없어요)

**② 알림 함수 올리기** — Firebase 콘솔 왼쪽 아래에서 요금제를 **Blaze(종량제)** 로 바꿔요. (크루 규모면 무료 사용량 안이에요. 걱정되면 Google Cloud 결제에서 예산 알림을 1,000원으로 걸어 두세요)
그다음 Firestore Database 화면 위쪽에 보이는 **위치**를 확인해요. `asia-northeast3`(서울)가 아니면 `functions/index.js` 의 `REGION` 을 그 값으로 바꿔요.
```
cd functions
npm install
cd ..
firebase deploy --only functions
```

**③ 폰에서 켜기**
- 아이폰: **iOS 16.4 이상**, Safari로 공식 주소를 열어 **공유 → 홈 화면에 추가** → 홈 화면 아이콘으로 실행 → 설정 → 푸시 알림 **켜기** → 허용.
- 안드로이드: Chrome에서 바로 켜도 돼요 (홈 화면 추가 권장).
- 켠 뒤 **"나에게 테스트 알림 보내기"** 를 누르고 앱을 닫아요. 5~10초 안에 오면 성공!
- 안 오면 설정 → 푸시 알림 아래 점검표에서 빨간 항목을 확인해요. (키 없음 / 권한 차단 / 이 기기 등록 없음)
- 함수 로그: Firebase 콘솔 → Functions → dkoPush → 로그에서 오류를 볼 수 있어요.

## 5-1. DKO 월드 AI 주민 (Gemini) — v29.7

주민 말풍선의 **대화하기**는 서버 함수 `dkoNpc`가 Gemini에 물어봐서 대답해요. 키를 넣기 전에는 준비된 대사로 대답하니 앱은 그대로 동작해요.

1. https://aistudio.google.com/apikey 에서 API 키를 만들어요.
2. 터미널에서 키를 비밀값으로 저장해요 (코드나 앱에는 키가 들어가지 않아요).
```
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions:dkoNpc
```
3. (선택) 모델이나 하루 횟수를 바꾸려면 `functions/.env` 에 `NPC_MODEL=gemini-2.5-flash`, `NPC_DAILY=40` 을 적고 다시 배포해요.
- 로그인한 회원만 쓸 수 있고, 한 사람당 하루 40번(한국 날짜 기준)으로 막아요. Cloud Functions는 Blaze 요금제가 필요해요.

## 6. 보안 메모

- 권한 · 인증 배지 · 제재 · 운영진 여부는 규칙으로 막혀 있어서 본인이 바꿀 수 없어요.
- D-Coin · BP 같은 재화는 각자 회원 문서에 저장돼요. 그래서 개발 지식이 있는 사람이 자기 값을 직접 고치는 것까지는 막지 못해요.
  - 완전히 막으려면 Cloud Functions(유료 요금제)가 필요해요.
- 블로그 쓰기 권한:
  - 업데이트 글: 운영진 · 인증 배지
  - 소식 글: 명성 5레벨 이상도 가능

---

## 7. 기능 한눈에 보기 (v20.0)

- **탭 바 (v20):** 상점 · 채팅 · 플레이(홈) · 커뮤니티 · 대전 — 클래시 로얄식 아레나 탭 (설정에서 리퀴드 글래스로 변경 가능)
- **플레이 홈:** 3D 복셀 캐릭터 무대 · DKO 패스 바 · 게임 모드(월드 · 타운 · 퀘스트 러쉬 · 내전 · 1대1 · 파티 · 무한의 계단)
- **커뮤니티:** 레딧식 채널 (`channels`, `cposts`, `ccomments`) · 채널 만든 사람 + 공동 관리자
- **e스포츠 BETA:** OWCS 응원 팀 · 응원 수 (`cheers`) · 경기 일정과 승부 예측 (`esmatches`, 운영진이 경기 등록 · 결과 입력)
- **홈(아래쪽):** 출석 · 이벤트 동그라미 · 신입 퀘스트 · 다음 내전 · DKO 타운 · 크루 미션 · 리포트 카드
- **플레이:** 내전 · 1대1 · 파티 · 도구를 골라 들어가는 허브 (내전: 팀 배정 · OWCS 밴픽(팀 전체 실시간) · 일정 · 기록)
- **상점:** 오늘의 상점(매일 0시 교체, 25% 특가) · 패스(일일 · 주간 퀘스트) · 움직이는 꾸미기 · D-Coin
- **이벤트:** 운영진이 업데이트 축제 · BP 부스트 · 채팅 위크 · 스킨 공모전 · 할인 데이 등을 켜고 끔
- **DKO 타운:** 실시간 접속, E3 이모티콘, NPC, 에임 챌린지
- **DKO 월드 (베타):** 가운데 섬 + 크루원마다 생기는 섬, 벽돌(전용 재화)로 짓기 · 업그레이드 · 장애물 치우기 · 땅 넓히기, D-Coin 스페셜 장식 · 시간 단축, 3D 복셀 캐릭터. 데이터는 `islands` 컬렉션 (문서 id = uid) — **v20에서 `channels` · `cposts` · `ccomments` · `cheers` · `esmatches` 규칙이 추가됐어요. 규칙을 다시 게시해 주세요**
- **야문철:** 리플레이 코드 · 스탯표 · 사진으로 "누구 잘못?" 투표와 분석, 베스트 분석, 판결
- **배지:** 업적 15종 + 한정판 3종(리그 챔피언 · 포디움 · 창단 멤버) · 프로필에 3개 장착
- **DKO 가이드:** 업데이트 후 처음 접속하면 소개, 설정에서 다시 보기
- **채팅:** 카톡식 채팅 목록(분류별) · 메인 채팅 · 운영진 방 관리 · 프로필 바로 보기 · DKO 공감 아이콘
- **내전 MVP:** 내전이 끝나면 2시간 투표, 3시간 뒤 참석자 방 정리
- **PC 화면:** 큰 화면 + 마우스면 자동, 설정 → 화면 모드에서 직접 선택
- **변경 기록:** 설정 → 변경 기록 (지울 수 없음, 누구나 열람)
- **운영진 제어판:** 현황 · 이벤트 · 공지/채팅 배경 · 신고 · 회원 · 코드
