// Snug - all posts are saved in the browser (localStorage) for now.

const TAGS = ["All", "Diary", "Food", "Travel", "Thoughts", "Art"];
const MOODS = ["😊", "🥰", "😴", "🤔", "😢"];

const POSTS_KEY = "snug-posts";
const LIKED_KEY = "snug-liked";
const NAME_KEY = "snug-name";

const DAY = 24 * 60 * 60 * 1000;

// A few starter posts so the page is not empty on first visit
const starterPosts = [
  {
    id: 1,
    author: "Mira",
    title: "My first rainy-day chai",
    tag: "Food",
    mood: "🥰",
    body: "Ginger, two cardamom pods, and a little too much sugar. I sat by the window and watched the rain for an hour. Nobody texted me and it was perfect.",
    likes: 12,
    time: Date.now() - 2 * DAY,
    mine: false
  },
  {
    id: 2,
    author: "Kabir",
    title: "Lost in Jaipur lanes",
    tag: "Travel",
    mood: "😊",
    body: "I followed a stray cat for twenty minutes and ended up at the best kachori shop in the city. Sometimes getting lost is the whole plan.",
    likes: 8,
    time: Date.now() - 1 * DAY,
    mine: false
  },
  {
    id: 3,
    author: "Anvi",
    title: "Tiny doodles, big feelings",
    tag: "Art",
    mood: "🤔",
    body: "I started drawing one small thing every night. A mug, a plant, my slippers. Day 30 today and my hands finally feel less scared of the paper.",
    likes: 21,
    time: Date.now() - 5 * 60 * 60 * 1000,
    mine: false
  }
];

// ---------- state ----------
let posts = loadJSON(POSTS_KEY, starterPosts);
let liked = loadJSON(LIKED_KEY, []);
let activeTag = "All";
let pickedMood = MOODS[0];

// ---------- elements ----------
const feed = document.getElementById("feed");
const filters = document.getElementById("filters");
const dialog = document.getElementById("writeDialog");
const form = document.getElementById("writeForm");
const moodBox = document.getElementById("moods");
const toast = document.getElementById("toast");

// ---------- small helpers ----------
function loadJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    return fallback;
  }
}

function saveAll() {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  localStorage.setItem(LIKED_KEY, JSON.stringify(liked));
}

// Stops people from sneaking HTML into their posts
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function timeAgo(time) {
  const minutes = Math.floor((Date.now() - time) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes + " min ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + (hours === 1 ? " hour ago" : " hours ago");
  const days = Math.floor(hours / 24);
  return days + (days === 1 ? " day ago" : " days ago");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// ---------- drawing the page ----------
function renderFilters() {
  filters.innerHTML = "";
  TAGS.forEach(tag => {
    const chip = document.createElement("button");
    chip.className = "chip" + (tag === activeTag ? " active" : "");
    chip.textContent = tag;
    chip.addEventListener("click", () => {
      activeTag = tag;
      renderFilters();
      renderFeed();
    });
    filters.appendChild(chip);
  });
}

function renderFeed() {
  const visible = posts.filter(p => activeTag === "All" || p.tag === activeTag);

  if (visible.length === 0) {
    feed.innerHTML = '<p class="empty">Nothing here yet. Be the first to write a ' +
      escapeHTML(activeTag) + ' post!</p>';
    return;
  }

  feed.innerHTML = visible.map(buildCard).join("");
}

function buildCard(post) {
  const isLiked = liked.includes(post.id);
  const isLong = post.body.length > 140;
  const preview = isLong ? post.body.slice(0, 140) + "..." : post.body;

  return `
    <article class="post" data-id="${post.id}" data-tag="${post.tag}">
      <div class="post-head">
        <div class="avatar">${escapeHTML(post.author.charAt(0).toUpperCase())}</div>
        <div>
          <div class="who">${escapeHTML(post.author)}</div>
          <div class="when">${timeAgo(post.time)}</div>
        </div>
        <span class="mood">${post.mood}</span>
      </div>
      <h3>${escapeHTML(post.title)}</h3>
      <p class="body-text">${escapeHTML(preview)}</p>
      ${isLong ? '<button class="more">Read more</button>' : ""}
      <div class="post-foot">
        <span class="tag">${post.tag}</span>
        ${post.mine ? '<button class="delete" title="Delete this post">🗑️</button>' : ""}
        <button class="like ${isLiked ? "liked" : ""}">
          <span class="heart">${isLiked ? "♥" : "♡"}</span> ${post.likes}
        </button>
      </div>
    </article>
  `;
}

// ---------- clicks inside the feed ----------
feed.addEventListener("click", event => {
  const card = event.target.closest(".post");
  if (!card) return;
  const id = Number(card.dataset.id);
  const post = posts.find(p => p.id === id);

  if (event.target.closest(".like")) {
    toggleLike(post);
  } else if (event.target.closest(".delete")) {
    if (confirm("Delete this post?")) {
      posts = posts.filter(p => p.id !== id);
      saveAll();
      renderFeed();
      showToast("Post deleted");
    }
  } else if (event.target.closest(".more")) {
    const button = event.target.closest(".more");
    const text = card.querySelector(".body-text");
    const expanded = button.textContent === "Show less";
    text.textContent = expanded ? post.body.slice(0, 140) + "..." : post.body;
    button.textContent = expanded ? "Read more" : "Show less";
  }
});

function toggleLike(post) {
  if (liked.includes(post.id)) {
    liked = liked.filter(id => id !== post.id);
    post.likes -= 1;
  } else {
    liked.push(post.id);
    post.likes += 1;
  }
  saveAll();
  renderFeed();

  // little bounce on the heart that was just clicked
  const button = document.querySelector(`.post[data-id="${post.id}"] .like`);
  if (button) {
    button.classList.add("pop");
    setTimeout(() => button.classList.remove("pop"), 400);
  }
}

// ---------- write dialog ----------
function renderMoods() {
  moodBox.innerHTML = "";
  MOODS.forEach(mood => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mood-btn" + (mood === pickedMood ? " picked" : "");
    btn.textContent = mood;
    btn.addEventListener("click", () => {
      pickedMood = mood;
      renderMoods();
    });
    moodBox.appendChild(btn);
  });
}

document.getElementById("openWrite").addEventListener("click", () => {
  document.getElementById("authorInput").value = localStorage.getItem(NAME_KEY) || "";
  renderMoods();
  dialog.showModal();
});

document.getElementById("cancelWrite").addEventListener("click", () => dialog.close());

form.addEventListener("submit", event => {
  event.preventDefault();

  const author = document.getElementById("authorInput").value.trim();
  const title = document.getElementById("titleInput").value.trim();
  const body = document.getElementById("bodyInput").value.trim();
  const tag = document.getElementById("tagInput").value;

  if (!author || !title || !body) return;

  localStorage.setItem(NAME_KEY, author);

  posts.unshift({
    id: Date.now(),
    author: author,
    title: title,
    tag: tag,
    mood: pickedMood,
    body: body,
    likes: 0,
    time: Date.now(),
    mine: true
  });

  saveAll();
  form.reset();
  dialog.close();
  activeTag = "All";
  renderFilters();
  renderFeed();
  showToast("Published!");
});

// ---------- start ----------
renderFilters();
renderFeed();