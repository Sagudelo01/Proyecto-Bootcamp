/*
 * Watch this tutorial on YouTube
 * https://youtu.be/fIR3isyFV8s
 */

const resizeBtn = document.querySelector("[data-resize-btn]");

resizeBtn.addEventListener("click", function (e) {
  e.preventDefault();
  document.body.classList.toggle("sb-expanded");
});
