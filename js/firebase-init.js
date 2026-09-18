// ===================================================
// 해밀푸드 (Hamil Food) — Firebase 초기화
// ===================================================
// 아래 firebaseConfig 값은 Firebase 콘솔 > 프로젝트 설정 > 일반 >
// "내 앱" 섹션에서 복사한 값으로 반드시 교체해야 합니다.
// (Firebase config 값은 공개되어도 안전합니다 — 실제 접근 제어는
//  Firestore 보안 규칙과 Authentication이 담당합니다.)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// 아이디 로그인을 위해 내부적으로 붙이는 가짜 이메일 도메인
// (Firebase Authentication의 이메일/비밀번호 로그인 방식을
//  일반 아이디/비밀번호처럼 쓰기 위한 방법입니다.)
export const LOGIN_DOMAIN = "hamilfood.local";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
