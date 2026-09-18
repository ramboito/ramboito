// ===================================================
// 해밀푸드 (Hamil Food) — 로그인 처리
// ===================================================
import { auth, LOGIN_DOMAIN } from "./firebase-init.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const form = document.querySelector("#login-form");
const errorEl = document.querySelector("#login-error");
const submitBtn = document.querySelector("#login-submit");

// 이미 로그인되어 있으면 바로 장부 페이지로 이동
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "ledger.html";
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.classList.remove("show");

  const id = document.querySelector("#login-id").value.trim();
  const password = document.querySelector("#login-password").value;

  if (!id || !password) {
    errorEl.textContent = "아이디와 비밀번호를 입력해 주세요.";
    errorEl.classList.add("show");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "로그인 중...";

  try {
    await signInWithEmailAndPassword(auth, `${id}@${LOGIN_DOMAIN}`, password);
    window.location.href = "ledger.html";
  } catch (err) {
    errorEl.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    errorEl.classList.add("show");
    submitBtn.disabled = false;
    submitBtn.textContent = "로그인";
  }
});
