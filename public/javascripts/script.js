//Selectors
let header = document.querySelector(".header");
let hamburgerMenu = document.querySelector(".hamburger-menu");

window.addEventListener("scroll", function () {
  let windowPostion = window.scrollY > 0;
  header.classList.toggle("active", windowPostion);
});

hamburgerMenu.addEventListener("click", function () {
  header.classList.toggle("nav-open");
});
