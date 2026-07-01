const wishes = [
  {
    text: "今日は、甘いものの近くに行きたい",
    hint: "買わなくても、見に行くだけでいい。",
    reactions: ["くんくんしてる", "こっち、気になるみたい", "少し見てみる？", "前まで行くだけでも十分"]
  },
  {
    text: "気になるお店の前まで行きたいな",
    hint: "入れなくても、前で立ち止まれたら十分。",
    reactions: ["ここ、気になるみたい", "前まで行ってみる？", "入らなくてもいいよ", "少しだけ近いかも"]
  },
  {
    text: "今日は、何もしない場所がほしい",
    hint: "座れそうなところを見つけたら、そこが今日の居場所。",
    reactions: ["静かな方かも", "少し休めそう", "ここで息してもいいよ", "やめてもいいよ"]
  },
  {
    text: "食べたい方、選んでいいと思う",
    hint: "人に合わせないごはんを、少しだけ思い出す。",
    reactions: ["こっち、好きかも", "ちゃんと選んでいいよ", "食べたい方でいいよ", "少し見てみる？"]
  },
  {
    text: "SNSに載せない景色、見つけたい",
    hint: "誰にも見せない景色が、今日の寄り道。",
    reactions: ["ここ、自分だけっぽい", "少し見てみる？", "急がなくていいよ", "くんくんしてる"]
  },
  {
    text: "今日は、予定にない寄り道がしたい",
    hint: "予定から少し外れるだけでいい。",
    reactions: ["こっち、気になるみたい", "予定にない方かも", "前まで行くだけでも十分", "行ってもいいし、やめてもいい"]
  }
];

const notificationTexts = [
  "あの子が呼んでいます",
  "今日のわがままが届きました",
  "少しだけ、外に行きたいみたい",
  "あの子がそわそわしています"
];

const storageKey = "moca-detour-wish-v4";

const state = {
  wish: loadTodayWish(),
  targetAngle: 0,
  orientationActive: false,
  signFound: false
};

const els = {
  screens: document.querySelectorAll(".screen"),
  homeWish: document.querySelector("#home-wish"),
  startWish: document.querySelector("#start-wish"),
  sniffMessage: document.querySelector("#sniff-message"),
  sniffSub: document.querySelector("#sniff-sub"),
  sniffDog: document.querySelector("#sniff-dog"),
  followButton: document.querySelector("#follow-button"),
  homeSkipButton: document.querySelector("#home-skip-button"),
  beginDetourButton: document.querySelector("#begin-detour-button"),
  startSkipButton: document.querySelector("#start-skip-button"),
  sniffButton: document.querySelector("#sniff-button"),
  quitButton: document.querySelector("#quit-button"),
  notifyTestButton: document.querySelector("#notify-test-button"),
  finishCopy: document.querySelector("#finish-copy"),
  toast: document.querySelector("#toast")
};

initialize();

function initialize() {
  document.addEventListener("click", handleScreenTargetClick);
  els.followButton.addEventListener("click", openStart);
  els.homeSkipButton.addEventListener("click", () => finish("部屋にいる日も、この子はとなりにいます。"));
  els.beginDetourButton.addEventListener("click", beginDetour);
  els.startSkipButton.addEventListener("click", () => finish("また今度でいいよ。"));
  els.sniffButton.addEventListener("click", handleSniffButton);
  els.quitButton.addEventListener("click", () => finish("やめることも、自分に甘い選択。"));
  els.notifyTestButton.addEventListener("click", sendTestNotification);
  renderWish();
}

function handleScreenTargetClick(event) {
  const target = event.target.closest("[data-screen-target]");
  if (!target) return;
  showScreen(target.dataset.screenTarget);
}

function showScreen(name) {
  els.screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === `${name}-screen`);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderWish() {
  els.homeWish.textContent = state.wish.text;
  els.startWish.textContent = state.wish.text;
}

function openStart() {
  showScreen("start");
}

async function beginDetour() {
  state.targetAngle = Math.floor(Math.random() * 360);
  state.signFound = false;
  els.sniffButton.textContent = "くんくんサインを見る";
  setSniffMood("curious", "こっち、気になるみたい", "振動は「少し見てみて」の合図。行かなくてもいい。");
  showScreen("sniff");
  await startOrientationIfPossible();
}

function handleSniffButton() {
  if (state.signFound) {
    finish("前まで行けただけでも、ちゃんと自分の時間。");
    return;
  }
  simulateSniff();
}

async function startOrientationIfPossible() {
  if (!window.DeviceOrientationEvent) return;

  try {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") return;
    }
    window.addEventListener("deviceorientation", handleOrientation);
    state.orientationActive = true;
  } catch {
    state.orientationActive = false;
  }
}

function handleOrientation(event) {
  if (state.signFound) return;
  const heading = typeof event.webkitCompassHeading === "number"
    ? event.webkitCompassHeading
    : 360 - (event.alpha || 0);
  checkSniffDirection(heading);
}

function simulateSniff() {
  const heading = Math.floor(Math.random() * 360);
  checkSniffDirection(heading);
}

function checkSniffDirection(heading) {
  const diff = angleDistance(heading, state.targetAngle);

  if (diff < 35) {
    state.signFound = true;
    vibrate([90, 30, 90]);
    setSniffMood("happy", pickNearbyReaction(), "行ってもいいし、やめてもいい。");
    els.sniffButton.textContent = "少し見てみる";
    return;
  }

  if (diff < 95) {
    vibrate([45]);
    setSniffMood("curious", "少し見てみる？", "気になったら、足を止めるだけでいい。");
    els.sniffButton.textContent = "もう一度くんくんする";
    return;
  }

  setSniffMood("sleepy", Math.random() > 0.5 ? "きょろきょろしてる" : "まだ眠そう", "違ったら、今日はやめてもいい。");
  els.sniffButton.textContent = "もう一度くんくんする";
}

function pickNearbyReaction() {
  const candidates = state.wish.reactions.filter((item) =>
    item.includes("気になる") || item.includes("見て") || item.includes("前まで") || item.includes("くんくん")
  );
  return pick(candidates.length ? candidates : state.wish.reactions);
}

function setSniffMood(mood, message, sub) {
  els.sniffDog.classList.remove("is-curious", "is-happy", "is-sleepy");
  els.sniffDog.classList.add(`is-${mood}`);
  els.sniffMessage.textContent = message;
  els.sniffSub.textContent = sub;
}

function finish(copy) {
  stopOrientation();
  els.finishCopy.textContent = copy || "前まで行けただけでも、ちゃんと自分の時間。";
  showScreen("finish");
}

function stopOrientation() {
  if (!state.orientationActive) return;
  window.removeEventListener("deviceorientation", handleOrientation);
  state.orientationActive = false;
}

async function sendTestNotification() {
  if (!("Notification" in window)) {
    showToast("このブラウザでは通知を出せません。");
    return;
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    showToast("通知が許可されませんでした。");
    return;
  }

  new Notification(pick(notificationTexts), {
    body: "開くまで、今日のわがままは内緒です。"
  });
  showToast("通知を出しました。");
}

function loadTodayWish() {
  const today = getTodayKey();
  const saved = readJson(storageKey, null);
  if (saved?.date === today && saved.wish) return saved.wish;

  const wish = pick(wishes);
  writeJson(storageKey, { date: today, wish });
  return wish;
}

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function angleDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast("このブラウザでは保存できませんでした。");
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2400);
}
