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

### ④ 첫 접속
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

## 4. 구글 로그인 참고

- Safari나 Chrome 브라우저에서는 GitHub Pages에서도 잘 돼요.
- 아이폰 **홈 화면 앱**에서는 Safari 보안 정책 때문에 다른 도메인(github.io ↔ firebaseapp.com) 간 구글 로그인이 실패할 수 있어요.
  - 이때는 같은 폴더를 Firebase Hosting에 올려 `https://overwatche3-6508d.web.app` 주소를 쓰면 확실해요. 앱이 그 도메인을 자동으로 로그인 도메인으로 써요.
  - 닉네임 + 비밀번호 로그인은 어디서나 문제없어요.

### (선택) Firebase Hosting으로 올리기
PC에 Node.js를 설치하고 이 폴더에서 아래를 실행해요.

```
npm install -g firebase-tools
firebase login
firebase deploy
```

이렇게 하면 보안 규칙 두 개도 같이 적용돼요.

---

## 5. 보안 메모

- 권한 · 인증 배지 · 제재 · 운영진 여부는 규칙으로 막혀 있어서 본인이 바꿀 수 없어요.
- D-Coin · BP 같은 재화는 각자 회원 문서에 저장돼요. 그래서 개발 지식이 있는 사람이 자기 값을 직접 고치는 것까지는 막지 못해요.
  - 완전히 막으려면 Cloud Functions(유료 요금제)가 필요해요.
- 블로그 쓰기 권한:
  - 업데이트 글: 운영진 · 인증 배지
  - 소식 글: 명성 5레벨 이상도 가능
