const wishes = [
  {
    text: "今日は、甘いものをちゃんと選びたい",
    hint: "買わなくても、見に行くだけでいい。",
    kind: "sweet",
    reactions: ["甘い気配、するかも", "このへん、キラキラしてる", "少し見てみる？", "前まで行けたら十分"],
    finish: "今日は、少し自分のために選べたね。"
  },
  {
    text: "気になってたお店の前まで行きたい",
    hint: "入れなくても、前で立ち止まれたら十分。",
    kind: "shop",
    reactions: ["ここ、気になる", "前まで行ってみたい", "入らなくてもいいよ", "近くにわがままの気配"],
    finish: "入れなくても、気になれたから十分。"
  },
  {
    text: "静かな場所で、少しだけぼーっとしたい",
    hint: "座れそうなところを見つけたら、そこが今日の居場所。",
    kind: "rest",
    reactions: ["静かな方かも", "少し休めそう", "ここで息してもいいよ", "やめてもいいよ"],
    finish: "何もしない時間も、ちゃんと寄り道だよ。"
  },
  {
    text: "本当に食べたいものを選びたい",
    hint: "人に合わせないごはんを、少しだけ思い出す。",
    kind: "food",
    reactions: ["こっち、好きかも", "ちゃんと選んでいいよ", "食べたい方でいいよ", "少し見てみる？"],
    finish: "人に合わせずに選べた気持ち、少し残ったね。"
  },
  {
    text: "誰にも見せない景色を見つけたい",
    hint: "誰にも見せない景色が、今日のわがまま。",
    kind: "view",
    reactions: ["ここ、自分だけっぽい", "少し見てみる？", "急がなくていいよ", "きらっとしてる"],
    finish: "誰にも見せない景色を、少し気にできたね。"
  },
  {
    text: "予定にないカフェに入りたい",
    hint: "予定から少し外れるだけでいい。",
    kind: "cafe",
    reactions: ["こっち、気になる", "予定にない方かも", "前まで行くだけでも十分", "行ってもいいし、やめてもいい"],
    finish: "前まで行けただけでも、今日のわがままは少し叶ったね。"
  },
  {
    text: "今日は、早く帰ってもいい場所に行きたい",
    hint: "すぐ帰れる寄り道でも、寄り道は寄り道。",
    kind: "rest",
    reactions: ["帰りたくなったら帰ろ", "少しだけでいいよ", "無理しなくていい", "ここまででも十分"],
    finish: "帰りたくなったら帰るのも、わがままだよ。"
  }
];

const notificationTexts = [
  "小悪魔が呼んでいます",
  "今日のわがままが届きました",
  "少しだけ、外が気になるみたい",
  "小悪魔がそわそわしています"
];

const moodClasses = [
  "is-looking",
  "is-restless",
  "is-curious",
  "is-happy",
  "is-sleepy",
  "is-sad",
  "is-pouty",
  "is-fun"
];

const storageKey = "devil-detour-wish-v1";
const roomMemoryKey = "devil-detour-room-memory-v1";

const state = {
  wish: loadTodayWish(),
  memory: loadRoomMemory(),
  targetAngle: 0,
  orientationActive: false,
  signFound: false,
  hasHeading: false,
  lastVibrateAt: 0,
  vibrationSupported: typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
};

const els = {
  screens: document.querySelectorAll(".screen"),
  memoryRooms: document.querySelectorAll("[data-room-memory]"),
  homeWish: document.querySelector("#home-wish"),
  startWish: document.querySelector("#start-wish"),
  sniffMessage: document.querySelector("#sniff-message"),
  sniffSub: document.querySelector("#sniff-sub"),
  sensorStatus: document.querySelector("#sensor-status"),
  homeCharacter: document.querySelector("#home-character"),
  startCharacter: document.querySelector("#start-character"),
  sniffCharacter: document.querySelector("#sniff-character"),
  finishCharacter: document.querySelector("#finish-character"),
  followButton: document.querySelector("#follow-button"),
  homeSkipButton: document.querySelector("#home-skip-button"),
  beginDetourButton: document.querySelector("#begin-detour-button"),
  startSkipButton: document.querySelector("#start-skip-button"),
  sniffButton: document.querySelector("#sniff-button"),
  quitButton: document.querySelector("#quit-button"),
  notifyTestButton: document.querySelector("#notify-test-button"),
  finishCopy: document.querySelector("#finish-copy"),
  finishTitle: document.querySelector("#finish-title"),
  toast: document.querySelector("#toast")
};

initialize();

function initialize() {
  document.addEventListener("click", handleScreenTargetClick);
  els.followButton.addEventListener("click", openStart);
  els.homeSkipButton.addEventListener("click", () => finish("部屋にいる日も、小悪魔はとなりにいます。", false, "sleepy"));
  els.beginDetourButton.addEventListener("click", beginDetour);
  els.startSkipButton.addEventListener("click", () => finish("また今度でいいよ。", false, "sad"));
  els.sniffButton.addEventListener("click", handleSignalButton);
  els.quitButton.addEventListener("click", () => finish("今日はここまでで大丈夫。帰りたくなったら帰るのも、わがままだよ。", true, "pouty"));
  els.notifyTestButton.addEventListener("click", sendTestNotification);
  renderWish();
  renderRoomMemory();
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
  setCharacterMood(els.homeCharacter, moodForWish(state.wish.kind));
  setCharacterMood(els.startCharacter, "restless");
}

function openStart() {
  showScreen("start");
}

async function beginDetour() {
  state.targetAngle = Math.floor(Math.random() * 360);
  state.signFound = false;
  state.hasHeading = false;
  state.lastVibrateAt = 0;
  els.sniffButton.textContent = "振動を試す";
  state.vibrationSupported = vibrate(18, { force: true, warmup: true, visual: false }) || state.vibrationSupported;
  setSignalMood("curious", "このへん、気になるみたい", "振動したら、スマホを少し下げて周りを見てみて。");
  setSensorStatus(state.vibrationSupported ? "立ち止まって、スマホをゆっくり向けてみて。" : "振動に対応したスマホでは、近い向きでブルッとします。");
  showScreen("sniff");
  await startOrientationIfPossible();
}

function handleSignalButton() {
  if (state.signFound) {
    finish(state.wish.finish, true, "fun");
    return;
  }
  simulateSignal();
}

async function startOrientationIfPossible() {
  if (!window.DeviceOrientationEvent) {
    setSensorStatus("この端末では向きセンサーが使えないみたい。ボタンで試せます。");
    return;
  }

  try {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") {
        setSensorStatus("向きセンサーが許可されませんでした。ボタンで試せます。");
        return;
      }
    }
    window.removeEventListener("deviceorientation", handleOrientation);
    window.removeEventListener("deviceorientationabsolute", handleOrientation);
    window.addEventListener("deviceorientation", handleOrientation);
    window.addEventListener("deviceorientationabsolute", handleOrientation);
    state.orientationActive = true;
    els.sniffButton.textContent = "振動を試す";
    setSensorStatus("向きセンサーを見ています。ゆっくり向きを変えてみて。");
  } catch {
    state.orientationActive = false;
    setSensorStatus("向きセンサーが使えませんでした。ボタンで試せます。");
  }
}

function handleOrientation(event) {
  if (state.signFound) return;
  const heading = getHeading(event);
  if (heading === null) {
    if (!state.hasHeading) setSensorStatus("向きが読み取れない時は、ボタンで試せます。");
    return;
  }
  state.hasHeading = true;
  checkSignalDirection(heading, true);
}

function simulateSignal() {
  checkSignalDirection(state.targetAngle, false);
}

function checkSignalDirection(heading, fromSensor = false) {
  const diff = angleDistance(heading, state.targetAngle);

  if (diff < 35) {
    state.signFound = true;
    const didVibrate = vibrate([160, 55, 180], { force: true });
    setSignalMood("fun", pickNearbyReaction(), "画面より、周りを見てみよう。行ってもいいし、やめてもいい。");
    setSensorStatus(didVibrate ? "今、スマホがブルッとしました。" : "画面がぷるっとしたら、小悪魔サインです。");
    els.sniffButton.textContent = "少し見てみる";
    return;
  }

  if (diff < 95) {
    setSignalMood("curious", "小悪魔が、こっちを気にしてる", "気になる場所、あった？ 前まででも十分。");
    setSensorStatus(fromSensor ? "近いかも。もう少しだけ向きを変えてみて。" : "近いかも。スマホなら向きで探せます。");
    els.sniffButton.textContent = fromSensor ? "振動を試す" : "もう一度サインを試す";
    return;
  }

  const isSleepy = Math.random() > 0.5;
  setSignalMood(isSleepy ? "sleepy" : "pouty", isSleepy ? "まだ違うみたい" : "きょろきょろしてる", "違ったら、立ち止まって向きを変えてみて。");
  setSensorStatus(fromSensor ? "まだ違うみたい。ゆっくり向きを変えてみて。" : "スマホを向けると、近い方向で震えます。");
  els.sniffButton.textContent = fromSensor ? "振動を試す" : "もう一度サインを試す";
}

function getHeading(event) {
  if (typeof event.webkitCompassHeading === "number") return event.webkitCompassHeading;
  if (typeof event.alpha !== "number") return null;
  return event.absolute ? event.alpha : 360 - event.alpha;
}

function pickNearbyReaction() {
  const candidates = state.wish.reactions.filter((item) =>
    item.includes("気になる") || item.includes("見て") || item.includes("前まで") || item.includes("キラキラ")
  );
  return pick(candidates.length ? candidates : state.wish.reactions);
}

function setSignalMood(mood, message, sub) {
  setCharacterMood(els.sniffCharacter, mood);
  els.sniffMessage.textContent = message;
  els.sniffSub.textContent = sub;
}

function setCharacterMood(character, mood) {
  if (!character) return;
  character.classList.remove(...moodClasses);
  character.classList.add(`is-${mood}`);
}

function moodForWish(kind) {
  const moods = {
    cafe: "fun",
    sweet: "happy",
    food: "happy",
    shop: "pouty",
    view: "curious",
    rest: "sleepy",
    detour: "restless"
  };
  return moods[kind] || "looking";
}

function setSensorStatus(message) {
  if (els.sensorStatus) els.sensorStatus.textContent = message;
}

function finish(copy, shouldLeaveTrace = false, mood = "happy") {
  stopOrientation();
  if (shouldLeaveTrace) rememberDetour(state.wish.kind);
  setCharacterMood(els.finishCharacter, mood);
  els.finishTitle.textContent = "今日はこれで十分";
  els.finishCopy.textContent = copy || "前まで行けただけでも、ちゃんと自分の時間。";
  renderRoomMemory();
  showScreen("finish");
}

function rememberDetour(kind) {
  state.memory = {
    glow: Math.min(3, (state.memory.glow || 0) + 1),
    motif: pickMotif(kind)
  };
  writeJson(roomMemoryKey, state.memory);
}

function renderRoomMemory() {
  els.memoryRooms.forEach((room) => {
    room.classList.toggle("has-glow-1", state.memory.glow >= 1);
    room.classList.toggle("has-glow-2", state.memory.glow >= 2);
    room.classList.toggle("has-glow-3", state.memory.glow >= 3);
    room.dataset.motif = state.memory.motif || "none";
  });
}

function pickMotif(kind) {
  const motifs = {
    cafe: "cup",
    sweet: "sweet",
    food: "sweet",
    shop: "ticket",
    view: "flower",
    rest: "cushion",
    detour: "ticket"
  };
  return motifs[kind] || "light";
}

function stopOrientation() {
  if (!state.orientationActive) return;
  window.removeEventListener("deviceorientation", handleOrientation);
  window.removeEventListener("deviceorientationabsolute", handleOrientation);
  state.orientationActive = false;
}

async function sendTestNotification() {
  if (!("Notification" in window)) {
    showToast("このブラウザでは通知を出せません。");
    return;
  }

  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();

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

function loadRoomMemory() {
  const saved = readJson(roomMemoryKey, null);
  if (!saved) return { glow: 0, motif: "none" };
  return {
    glow: Math.max(0, Math.min(3, Number(saved.glow) || 0)),
    motif: saved.motif || "none"
  };
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

function vibrate(pattern, options = {}) {
  const now = Date.now();
  const { force = false, warmup = false, visual = true } = options;
  if (!force && !warmup && now - state.lastVibrateAt < 1200) return false;
  if (visual) playVibrationFeedback();

  if (typeof navigator.vibrate !== "function") return false;

  let didVibrate = false;
  try {
    didVibrate = Boolean(navigator.vibrate(pattern));
  } catch {
    didVibrate = false;
  }

  if (!warmup) state.lastVibrateAt = now;
  return didVibrate;
}

function playVibrationFeedback() {
  document.body.classList.add("is-vibrating");
  els.sniffCharacter?.classList.add("is-pulsing");
  window.clearTimeout(playVibrationFeedback.timer);
  playVibrationFeedback.timer = window.setTimeout(() => {
    document.body.classList.remove("is-vibrating");
    els.sniffCharacter?.classList.remove("is-pulsing");
  }, 520);
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
