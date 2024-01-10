// ********** set date ************
const date = document.getElementById('date');
date.textContent = new Date().getFullYear();

// ********** sidebar ************
const navBtn = document.querySelector('.nav-btn');
const sidebar = document.querySelector('.sidebar');
const closeBtn = document.querySelector('.close-btn');

navBtn.addEventListener('click', () => {
  sidebar.classList.add('show-sidebar');
});
closeBtn.addEventListener('click', () => {
  sidebar.classList.remove('show-sidebar');
});

// ********** navbar fixed ************
const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
  const navHeight = nav.getBoundingClientRect().height;
  const scrollHeight = window.pageYOffset;

  if (scrollHeight > navHeight) {
    nav.classList.add('nav-fixed');
  } else {
    nav.classList.remove('nav-fixed');
  }
});

// ********** smooth scroll ************
const scrollLinks = document.querySelectorAll('.scroll-link');

scrollLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    // prevent default
    e.preventDefault();
    // select target element
    const id = e.currentTarget.getAttribute('href').slice(1);
    const element = document.getElementById(id);
    // check if nav is fixed or not
    const isNavFixed = nav.classList.contains('nav-fixed');
    const navHeight = nav.getBoundingClientRect().height;
    // change position
    let position = element.offsetTop - navHeight;
    if (!isNavFixed) {
      position = position - navHeight;
    }
    window.scrollTo({
      left: 0,
      top: position,
    });
    sidebar.classList.remove('show-sidebar');
  });
});

// ********** set age ************
// const age = document.getElementById('age');
// magic number: 31557600000 is 24 * 3600 * 365.25 * 1000 Which is the length of a year, the length of a year is 365 days and 6 hours which is 0.25 day. In the end i floor the result which gives us the final age.
// age.textContent = Math.floor(
//   (new Date() - new Date('2001-08-04').getTime()) / 3.15576e10
// );

// ********** read more ************
const dots = document.getElementById('dots');
const moreText = document.getElementById('more-text');
const toggleTextBtn = document.getElementById('toggle-text-btn');

toggleTextBtn.addEventListener('click', (e) => {
  if (dots.style.display === 'none') {
    dots.style.display = 'inline';
    moreText.style.display = 'none';
    toggleTextBtn.innerHTML = 'read more <i class="fas fa-angle-down"></i>';
  } else {
    moreText.style.display = 'inline';
    dots.style.display = 'none';
    toggleTextBtn.innerHTML = 'show less <i class="fas fa-angle-up"></i>';
  }
});

// ********** dark mode ************

// set default theme
let theme;
if (localStorage.getItem('theme')) {
  theme = localStorage.getItem('theme');
} else {
  theme = 'light';
}

// change toggle btn content FUNCTION
const changeToggleBtn = () => {
  document
    .querySelectorAll('.toggle-theme')
    .forEach(
      (btn) =>
        (btn.innerHTML = `${
          theme === 'light'
            ? '<i class="fas fa-toggle-off"></i>'
            : '<i class="fas fa-toggle-on"></i>'
        }`)
    );
};

// switch theme FUNCTION
const switchTheme = () => {
  if (theme === 'light') {
    theme = 'dark';
  } else {
    theme = 'light';
  }
  localStorage.setItem('theme', theme);
  document.documentElement.className = theme;
  changeToggleBtn();
};

// updating theme on initial render
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.className = theme;
  changeToggleBtn();
});

// updating theme on clicking the toggle btn
document.querySelectorAll('.toggle-theme').forEach((btn) => {
  btn.addEventListener('click', switchTheme);
});
