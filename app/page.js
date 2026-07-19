"use client";

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { useEffect, useRef, useState } from "react";

const firebaseConfig = {
  apiKey: "AIzaSyCGAfHdsBIJWZzaWBlvYu4hGUamPgS854I",
  authDomain: "designe-hana.firebaseapp.com",
  projectId: "designe-hana",
  storageBucket: "designe-hana.firebasestorage.app",
  messagingSenderId: "851897207048",
  appId: "1:851897207048:web:5cbd5b01b8f59c4f79c4bd"
};

const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

const wishes = [
  {
    text: "今日は、甘いものをちゃんと選びたい!",
    reactions: ["甘い気配、するかも!", "このへん、キラキラしてる!", "少し見てみる?", "前まで行けたら十分!"],
    finish: "今日は、少し自分のために選べたね!"
  },
  {
    text: "気になってたお店の前まで行きたい!",
    reactions: ["ここ、気になる!", "前まで行ってみたい!", "入らなくてもいいよ!", "近くにわがままの気配!"],
    finish: "入れなくても、気になれたから十分!"
  },
  {
    text: "静かな場所で、少しだけぼーっとしたい!",
    reactions: ["静かな方かも!", "少し休めそう!", "ここで息してもいいよ!", "やめてもいいよ!"],
    finish: "何もしない時間も、ちゃんと寄り道だよ!"
  },
  {
    text: "本当に食べたいものを選びたい!",
    reactions: ["こっち、好きかも!", "ちゃんと選んでいいよ!", "食べたい方でいいよ!", "少し見てみる?"],
    finish: "人に合わせずに選べた気持ち、少し残ったね!"
  },
  {
    text: "誰にも見せない景色を見つけたい!",
    reactions: ["ここ、自分だけっぽい!", "少し見てみる?", "急がなくていいよ!", "きらっとしてる!"],
    finish: "誰にも見せない景色を、少し気にできたね!"
  },
  {
    text: "予定にないカフェに入りたい!",
    reactions: ["こっち、気になる!", "予定にない方かも!", "前まで行くだけでも十分!", "行ってもいいし、やめてもいい!"],
    finish: "前まで行けただけでも、今日のわがままは少し叶ったね!"
  },
  {
    text: "今日は、早く帰ってもいい場所に行きたい!",
    reactions: ["帰りたくなったら帰ろ!", "少しだけでいいよ!", "無理しなくていい!", "ここまででも十分!"],
    finish: "帰りたくなったら帰るのも、わがままだよ!"
  }
];

const notificationTexts = [
  "小悪魔が呼んでいます",
  "今日のわがままが届きました",
  "少しだけ、外が気になるみたい",
  "小悪魔がそわそわしています"
];

const storageKey = "devil-detour-wish-v1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

function assetPath(path) {
  return `${basePath}${path}`;
}

function stageStyle(type) {
  if (type === "outside") {
    return {
      "--stage-desktop-image": `url("${assetPath("/assets/outside-desktop.png")}")`,
      "--stage-mobile-image": `url("${assetPath("/assets/outside-mobile.png")}")`,
      "--bubble-image": `url("${assetPath("/assets/wagamee-bubble-wide.png")}")`
    };
  }

  return {
    "--stage-desktop-image": `url("${assetPath("/assets/room-dark-desktop.png")}")`,
    "--stage-mobile-image": `url("${assetPath("/assets/room-dark-mobile.png")}")`,
    "--bubble-image": `url("${assetPath("/assets/wagamee-bubble-wide.png")}")`
  };
}

function characterStyle(type) {
  if (type === "outside") {
    return {
      "--character-image": `url("${assetPath("/assets/devil-searching.png")}")`,
      "--character-found-image": `url("${assetPath("/assets/devil-found.png")}")`
    };
  }

  return {
    "--character-image": `url("${assetPath("/assets/devil-room-character.png")}")`
  };
}

export default function Home() {
  const [screen, setScreen] = useState("home");
  const [wish, setWish] = useState(wishes[0]);
  const [sniffMood, setSniffMood] = useState("curious");
  const [sniffMessage, setSniffMessage] = useState("このへん、気になるみたい!");
  const [sniffSub, setSniffSub] = useState("振動したら、スマホを少し下げて周りを見てみて。");
  const [sensorStatus, setSensorStatus] = useState("立ち止まって、スマホをゆっくり向けてみて。");
  const [sniffButtonText, setSniffButtonText] = useState("Try Vibe");
  const [finishTitle, setFinishTitle] = useState("今日はこれで十分!");
  const [finishCopy, setFinishCopy] = useState("前まで行けただけでも、ちゃんと自分の時間。");
  const [pushStatus, setPushStatus] = useState(
    firebaseVapidKey ? "" : "Firebase通知はVAPID key設定後に使えます。"
  );
  const [toast, setToast] = useState("");

  const targetAngleRef = useRef(0);
  const hasHeadingRef = useRef(false);
  const orientationActiveRef = useRef(false);
  const lastVibrateAtRef = useRef(0);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    setWish(loadTodayWish());
    registerServiceWorker();
    listenForForegroundMessages(showToast);

    return () => {
      stopOrientation();
      window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen]);

  function openStart() {
    setScreen("start");
  }

  async function beginDetour() {
    targetAngleRef.current = Math.floor(Math.random() * 360);
    hasHeadingRef.current = false;
    lastVibrateAtRef.current = 0;
    setSniffButtonText("Try Vibe");
    setSignalMood("curious", "このへん、気になるみたい!", "振動したら、スマホを少し下げて周りを見てみて。");
    setSensorStatus(
      typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
        ? "向きが合うと、スマホ本体がブルッと震えます。"
        : "対応スマホで開くと、向きが合った時に本体が震えます。"
    );
    setScreen("sniff");
    await startOrientationIfPossible();
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
      stopOrientation();
      window.addEventListener("deviceorientation", handleOrientation);
      window.addEventListener("deviceorientationabsolute", handleOrientation);
      orientationActiveRef.current = true;
      setSensorStatus("向きセンサーを見ています。ゆっくり向きを変えてみて。");
    } catch {
      orientationActiveRef.current = false;
      setSensorStatus("向きセンサーが使えませんでした。ボタンで試せます。");
    }
  }

  function handleOrientation(event) {
    const heading = getHeading(event);
    if (heading === null) {
      if (!hasHeadingRef.current) setSensorStatus("向きが読み取れない時は、ボタンで試せます。");
      return;
    }
    hasHeadingRef.current = true;
    checkSignalDirection(heading, true);
  }

  function checkSignalDirection(heading, fromSensor = false) {
    const diff = angleDistance(heading, targetAngleRef.current);

    if (diff < 35) {
      const didVibrate = vibrate([180, 60, 180], { force: true });
      setSignalMood("happy", pickNearbyReaction(wish), "スマホが震えた方向を、少し見てみよう。行ってもいいし、やめてもいい。");
      setSensorStatus(didVibrate ? "今、スマホ本体がブルッとしました。" : "対応スマホでは、ここで本体がブルッと震えます。");
      setSniffButtonText("Peek");
      return;
    }

    if (diff < 95) {
      setSignalMood("curious", "小悪魔が、こっちを気にしてる!", "気になる場所、あった？ 前まででも十分。");
      setSensorStatus(fromSensor ? "近いかも。もう少しだけ向きを変えてみて。" : "近いかも。スマホなら向きで探せます。");
      setSniffButtonText("Try Vibe");
      return;
    }

    setSignalMood(
      "sleepy",
      Math.random() > 0.5 ? "まだ違うみたい..." : "きょろきょろしてる!",
      "違ったら、立ち止まって向きを変えてみて。"
    );
    setSensorStatus(fromSensor ? "まだ違うみたい。ゆっくり向きを変えてみて。" : "スマホを向けると、近い方向で震えます。");
    setSniffButtonText("Try Vibe");
  }

  function finish(copy) {
    stopOrientation();
    setFinishTitle("今日はこれで十分!");
    setFinishCopy(copy || "前まで行けただけでも、ちゃんと自分の時間。");
    setScreen("finish");
  }

  function stopOrientation() {
    if (!orientationActiveRef.current) return;
    window.removeEventListener("deviceorientation", handleOrientation);
    window.removeEventListener("deviceorientationabsolute", handleOrientation);
    orientationActiveRef.current = false;
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

    if (!firebaseVapidKey) {
      new Notification(pick(notificationTexts), {
        body: "Firebase通知にはVAPID keyの設定が必要です。"
      });
      setPushStatus("通知許可はOK。次にVAPID keyをVercelへ設定してください。");
      showToast("通知許可はOK。VAPID keyが未設定です。");
      return;
    }

    const token = await requestFirebaseToken();
    if (!token) return;

    try {
      await navigator.clipboard?.writeText(token);
      setPushStatus("Firebase通知の準備OK。通知トークンをコピーしました。");
      showToast("通知トークンをコピーしました。Firebaseでテスト送信できます。");
    } catch {
      setPushStatus("Firebase通知の準備OK。通知トークンはConsoleに出しました。");
      showToast("通知トークンをConsoleに出しました。");
    }
    console.info("WagaMee FCM token:", token);
  }

  function setSignalMood(mood, message, sub) {
    setSniffMood(mood);
    setSniffMessage(message);
    setSniffSub(sub);
  }

  function vibrate(pattern, options = {}) {
    const now = Date.now();
    const { force = false } = options;
    if (!force && now - lastVibrateAtRef.current < 1200) return false;
    if (typeof navigator.vibrate !== "function") return false;

    let didVibrate = false;
    try {
      didVibrate = Boolean(navigator.vibrate(pattern));
    } catch {
      didVibrate = false;
    }

    lastVibrateAtRef.current = now;
    return didVibrate;
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2400);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" type="button" onClick={() => setScreen("home")} aria-label="WagaMeeの部屋へ戻る">
          <img className="brand-logo-image" src={assetPath("/assets/wagamee-logo-new.png")} alt="WagaMee" />
        </button>
        <button className="test-button" type="button" onClick={sendTestNotification}>
          通知を試す
        </button>
        {pushStatus ? <span className="push-status">{pushStatus}</span> : null}
      </header>

      <main>
        <section className={`screen ${screen === "home" ? "is-active" : ""}`} aria-labelledby="home-wish">
          <div className="stage stage-room" style={stageStyle("room")}>
            <div className="stage-overlay" aria-hidden="true"></div>
            <div className="speech-bubble main-bubble">
              <h1 id="home-wish">{wish.text}</h1>
            </div>
            <Character mood="looking" type="room" ariaLabel="ピンクの小悪魔キャラクター" />
            <div className="action-dock">
              <button className="primary-button" type="button" onClick={openStart}>
                Me-Time
              </button>
              <button className="ghost-button" type="button" onClick={() => finish("部屋にいる日も、小悪魔はとなりにいます。")}>
                Stay In
              </button>
            </div>
          </div>
        </section>

        <section className={`screen ${screen === "start" ? "is-active" : ""}`} aria-labelledby="start-wish">
          <div className="stage stage-outside" style={stageStyle("outside")}>
            <div className="stage-overlay" aria-hidden="true"></div>
            <div className="speech-bubble side-bubble">
              <h2 id="start-wish">{wish.text}</h2>
            </div>
            <Character mood="restless" type="outside" />
            <div className="action-dock">
              <button className="primary-button" type="button" onClick={beginDetour}>
                Devil Sign
              </button>
              <button className="ghost-button" type="button" onClick={() => finish("また今度でいいよ。")}>
                Done Today
              </button>
            </div>
          </div>
        </section>

        <section className={`screen ${screen === "sniff" ? "is-active" : ""}`} aria-labelledby="sniff-message">
          <div className="stage stage-outside" style={stageStyle("outside")}>
            <div className="stage-overlay" aria-hidden="true"></div>
            <div className="signal-ring" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="speech-bubble main-bubble signal-bubble">
              <h2 id="sniff-message">{sniffMessage}</h2>
              <span id="sniff-sub">{sniffSub}</span>
              <small className="sensor-status">{sensorStatus}</small>
            </div>
            <Character mood={sniffMood} type="outside" id="sniff-character" />
            <div className="action-dock">
              <button className="primary-button" type="button" onClick={() => checkSignalDirection(targetAngleRef.current, false)}>
                {sniffButtonText}
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => finish("今日はここまでで大丈夫。帰りたくなったら帰るのも、わがままだよ。")}
              >
                Done Today
              </button>
            </div>
          </div>
        </section>

        <section className={`screen ${screen === "finish" ? "is-active" : ""}`} aria-labelledby="finish-title">
          <div className="stage stage-room" style={stageStyle("room")}>
            <div className="stage-overlay" aria-hidden="true"></div>
            <div className="speech-bubble main-bubble">
              <h2 id="finish-title">{finishTitle}</h2>
              <span id="finish-copy">{finishCopy}</span>
            </div>
            <Character mood="happy" type="room" />
            <div className="action-dock">
              <button className="primary-button" type="button" onClick={() => setScreen("home")}>
                Summon Me
              </button>
            </div>
          </div>
        </section>
      </main>

      <div className={`toast ${toast ? "is-visible" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

function Character({ mood, type, id, ariaLabel }) {
  return (
    <div
      className={`character character-large is-${mood}`}
      id={id}
      style={characterStyle(type)}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      <span className="aura"></span>
      <span className="sparkle sparkle-one"></span>
      <span className="sparkle sparkle-two"></span>
      <span className="sparkle sparkle-three"></span>
    </div>
  );
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocalPreview) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.filter((key) => key.startsWith("wagamee-")).forEach((key) => caches.delete(key));
      });
    }
  }

  const register = () => {
    navigator.serviceWorker.register(`${basePath}/sw.js`).catch(() => {});
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

async function requestFirebaseToken() {
  try {
    const supported = await isSupported();
    if (!supported) {
      return null;
    }

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const registration = await navigator.serviceWorker.register(`${basePath}/sw.js`);
    const messaging = getMessaging(app);
    return await getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration
    });
  } catch (error) {
    console.error("Failed to get FCM token:", error);
    return null;
  }
}

async function listenForForegroundMessages(showToast) {
  try {
    const supported = await isSupported();
    if (!supported || !firebaseVapidKey) return;

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "WagaMee";
      showToast(title);
    });
  } catch (error) {
    console.warn("Firebase foreground notification listener was not started:", error);
  }
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

function getHeading(event) {
  if (typeof event.webkitCompassHeading === "number") return event.webkitCompassHeading;
  if (typeof event.alpha !== "number") return null;
  return event.absolute ? event.alpha : 360 - event.alpha;
}

function angleDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function pickNearbyReaction(wish) {
  const candidates = wish.reactions.filter(
    (item) => item.includes("気になる") || item.includes("見て") || item.includes("前まで") || item.includes("キラキラ")
  );
  return pick(candidates.length ? candidates : wish.reactions);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
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
    // 保存できない環境でも、体験そのものは続けられるようにする。
  }
}
