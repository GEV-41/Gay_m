
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --red: #b83336;
  --blue: #62baff;
  --panel: rgba(7, 10, 13, .88);
  --line: rgba(205, 220, 230, .17);
  --muted: #9ca8b1;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #030608;
  color: #edf2f5;
  font-family: Inter, Arial, sans-serif;
}

button, input { font: inherit; }

button {
  border: 1px solid #3b444b;
  background: #11171c;
  color: #eaf0f4;
  padding: 13px 15px;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: .08em;
  transition: .18s;
}

button:hover {
  background: #202a32;
  border-color: #87949d;
}

input {
  width: 100%;
  background: #080c0f;
  border: 1px solid #343d44;
  color: white;
  padding: 13px 12px;
  outline: none;
}

input:focus { border-color: #8ba8bd; }

.overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  background:
    linear-gradient(90deg, rgba(1,4,7,.88), rgba(1,4,7,.47)),
    url('cover.png') center / cover no-repeat;
}

.panel {
  width: min(450px, calc(100vw - 30px));
  padding: 34px;
  background: rgba(5,8,11,.88);
  border: 1px solid rgba(211,226,236,.2);
  box-shadow: 0 25px 100px #000;
  backdrop-filter: blur(12px);
}

.eyebrow {
  font-size: 10px;
  letter-spacing: .2em;
  color: #9aaab5;
  font-weight: 700;
}

.panel h1 {
  font: 800 62px/.95 'Barlow Condensed', sans-serif;
  letter-spacing: .025em;
  margin: 12px 0 8px;
}

.panel h1 span, .brand span { color: var(--red); }

.subtitle {
  color: #b4bec6;
  margin: 0 0 25px;
  font-size: 13px;
}

.panel label {
  display: block;
  font-size: 10px;
  letter-spacing: .16em;
  color: #9ba7b0;
  margin-bottom: 8px;
}

.panel input { margin-bottom: 12px; }
.panel button { width: 100%; margin-top: 9px; }

.panel .primary {
  background: #9f292d;
  border-color: #c74a4f;
}

.panel .primary:hover { background: #c2383d; }

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #7d8992;
  font-size: 9px;
  letter-spacing: .14em;
  margin: 20px 0 6px;
}

.divider::before, .divider::after {
  content: '';
  height: 1px;
  background: #303941;
  flex: 1;
}

.joinrow {
  display: flex;
  gap: 8px;
  margin-top: 9px;
}

.joinrow input { min-width: 0; margin: 0; }
.joinrow button { width: 100px; margin: 0; }

.status {
  min-height: 30px;
  font-size: 11px;
  line-height: 1.5;
  color: #8e9ba4;
  margin: 13px 0;
}

.controls {
  font-size: 9px;
  line-height: 1.7;
  color: #71808a;
  border-top: 1px solid #242c32;
  padding-top: 13px;
}

#game {
  position: fixed;
  inset: 0;
  display: none;
}

#scene {
  width: 100%;
  height: 100%;
  display: block;
}

.vignette {
  pointer-events: none;
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 140px 35px #000b;
  background: linear-gradient(
    180deg, #0008, transparent 22%, transparent 70%, #000b
  );
}

.topbar {
  position: absolute;
  left: 24px;
  right: 24px;
  top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.brand {
  font: 800 26px 'Barlow Condensed', sans-serif;
  letter-spacing: .1em;
}

.brand small {
  font: 600 9px Inter, sans-serif;
  letter-spacing: .17em;
  color: #9ba6ad;
  margin-left: 8px;
}

.topbar #roomBadge {
  font-size: 10px;
  letter-spacing: .15em;
  color: #aeb8bf;
  background: #080c0fa8;
  border: 1px solid var(--line);
  padding: 9px 12px;
}

.objective, .teammates {
  position: absolute;
  top: 75px;
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 15px 17px;
  backdrop-filter: blur(8px);
}

.objective { right: 24px; width: 230px; }

.objective strong {
  display: block;
  font-size: 15px;
  margin: 9px 0 4px;
}

.objective small {
  color: #a5b0b8;
  font-size: 11px;
}

.teammates { left: 24px; min-width: 190px; }

.playerline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-top: 13px;
}

.playerline i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #7ccda1;
  box-shadow: 0 0 9px #7ccda1;
}

.playerline b {
  font-size: 8px;
  letter-spacing: .1em;
  color: #aab5bc;
  margin-left: auto;
}

.playerline.remote i {
  background: #73b9f4;
  box-shadow: 0 0 9px #73b9f4;
}

.centerPrompt {
  position: absolute;
  left: 50%;
  top: 59%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  text-shadow: 0 2px 6px #000;
  color: white;
  letter-spacing: .05em;
  white-space: nowrap;
}

.bottomleft {
  position: absolute;
  left: 24px;
  bottom: 24px;
  width: min(380px, 45vw);
}

.stat {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 9px;
}

.stat > span { font-size: 20px; }

.stat b { font-size: 12px; width: 28px; }

.bar {
  height: 6px;
  background: #354047;
  flex: 1;
  max-width: 220px;
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  width: 100%;
  background: #b6d5c2;
  transition: width .12s;
}

.stamina .bar i { background: #80b8d9; }
.stamina > span { color: #b4d8ef; }

.help {
  font-size: 9px;
  letter-spacing: .1em;
  color: #a0adb5;
  margin-top: 16px;
}

.inventory {
  position: absolute;
  right: 24px;
  bottom: 25px;
  display: flex;
  gap: 7px;
}

.slot {
  width: 68px;
  height: 72px;
  border: 1px solid #b5c0c755;
  background: #06090cbf;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 25px;
  color: #cbd4da;
}

.slot.active {
  border-color: #e2e9ed;
  box-shadow: inset 0 0 15px #c4d7e41a;
}

.slot small {
  position: absolute;
  top: 5px;
  right: 6px;
  font-size: 9px;
  color: #9eabb4;
}

.slot label {
  position: absolute;
  bottom: 5px;
  font-size: 7px;
  letter-spacing: .1em;
  color: #9daab2;
}

.chat {
  position: absolute;
  left: 24px;
  bottom: 104px;
  width: 300px;
  background: rgba(4,7,10,.78);
  border: 1px solid var(--line);
}

.chathead {
  font-size: 9px;
  letter-spacing: .15em;
  padding: 10px;
  border-bottom: 1px solid #ffffff14;
  color: #a7b4bd;
}

.chathead span { float: right; color: #a9b4ba; }

#chatMessages {
  padding: 7px 10px;
  max-height: 110px;
  overflow-y: auto;
}

.chat p {
  font-size: 10px;
  color: #b4c0c7;
  margin: 6px 0;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.chat .systemmsg { color: #8b989f; font-style: italic; }

.chat form {
  display: flex;
  border-top: 1px solid #ffffff17;
}

.chat form input {
  border: 0;
  background: transparent;
  padding: 10px;
  font-size: 10px;
  min-width: 0;
}

.chat form button {
  padding: 0 12px;
  border: 0;
  background: transparent;
  color: #b6c5cf;
}

.hidden { display: none !important; }

#crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  color: #e6eff5aa;
  text-shadow: 0 0 4px black;
  pointer-events: none;
}

#toast {
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  background: #080c0ddd;
  border: 1px solid var(--line);
  padding: 10px 16px;
  opacity: 0;
  transition: opacity .2s;
  pointer-events: none;
}

#toast.show { opacity: 1; }

#damageFlash {
  position: absolute;
  inset: 0;
  background: rgba(150,12,18,.25);
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 650px) {
  .panel { padding: 24px; }
  .panel h1 { font-size: 50px; }
  .teammates {
    top: 70px; left: 10px;
    padding: 10px; min-width: 135px;
  }
  .objective {
    right: 10px; top: 70px;
    width: 170px; padding: 10px;
  }
  .topbar { left: 10px; right: 10px; top: 10px; }
  .bottomleft { left: 10px; bottom: 10px; width: 45vw; }
  .chat { left: 10px; bottom: 86px; width: 230px; }
  .inventory { right: 10px; bottom: 10px; gap: 3px; }
  .slot { width: 48px; height: 58px; }
  .slot label { font-size: 6px; }
  .help { font-size: 7px; }
  .objective strong { font-size: 12px; }
  .objective small { font-size: 9px; }
}

