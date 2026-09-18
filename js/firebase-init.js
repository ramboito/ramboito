// ===================================================
// 해밀푸드 (Hamil Food) — Firebase 초기화
// ===================================================
// (Firebase config 값은 공개되어도 안전합니다 — 실제 접근 제어는
//  Firestore 보안 규칙과 Authentication이 담당합니다.)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYiH_TT2BsCdhVIC7DW2QAyW0xUDVutCg",
  authDomain: "hamilfood-675ef.firebaseapp.com",
  projectId: "hamilfood-675ef",
  storageBucket: "hamilfood-675ef.firebasestorage.app",
  messagingSenderId: "263019708975",
  appId: "1:263019708975:web:dd018cc9f51c98d600fcda",
};

// 아이디 로그인을 위해 내부적으로 붙이는 가짜 이메일 도메인
// (Firebase Authentication의 이메일/비밀번호 로그인 방식을
//  일반 아이디/비밀번호처럼 쓰기 위한 방법입니다.)
export const LOGIN_DOMAIN = "hamilfood.local";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
