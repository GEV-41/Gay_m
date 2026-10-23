
/* =========================================================
   NIGHTFALL — Co-op Survival Horror
   File: game.js
   Requires Three.js and PeerJS from index.html
   ========================================================= */

(() => {
  "use strict";

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);

  const menu = $("menu");
  const game = $("game");
  const soloBtn = $("soloBtn");
  const hostBtn = $("hostBtn");
  const joinBtn = $("joinBtn");
  const playerName = $("playerName");
  const roomCode = $("roomCode");
  const netStatus = $("netStatus");
  const roomBadge = $("roomBadge");
  const playerList = $("playerList");
  const objectiveText = $("objectiveText");
  const objectiveHint = $("objectiveHint");
  const prompt = $("prompt");
  const toast = $("toast");
  const healthBar = $("healthBar");
  const healthNum = $("healthNum");
  const staminaBar = $("staminaBar");
  const chatMessages = $("chatMessages");
  const chatForm = $("chatForm");
  const chatInput = $("chatInput");
  const connectionDot = $("connectionDot");
  const damageFlash = $("damageFlash");
  const winScreen = $("winScreen");

  if (!window.THREE) {
    alert("Three.js failed to load. Check your internet connection.");
    return;
  }

  // ---------- Game state ----------
  const state = {
    running: false,
    dead: false,
    won: false,
    health: 100,
    stamina: 100,
    flashlight: true,
    hasKey: false,
    name: "HDP_Gamer",
    room: null,
    isHost: false,
    peer: null,
    connections: new Map(),
    remotes: new Map(),
    lastBroadcast: 0,
    lastDamage: 0,
    toastTimer: null,
    elapsed: 0
  };

  const keys = {};
  const raycaster = new THREE.Raycaster();
  const clock = new THREE.Clock();

  let scene, camera, renderer;
  let player, flashlight, flashlightGlow;
  let monster, monsterLight;
  let keyObject, exitObject;
  let rain;
  let worldObjects = [];
  let interactables = [];
  let gameStartedAt = 0;
  let lastChatTime = 0;

  const playerRadius = 0.42;
  const walkSpeed = 4.0;
  const sprintSpeed = 6.5;

  // ---------- Utility ----------
  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distanceXZ(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }

  function showToast(message, duration = 2400) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(
      () => toast.classList.remove("show"),
      duration
    );
  }

  function setObjective(title, hint) {
    objectiveText.textContent = title;
    objectiveHint.textContent = hint;
  }

  function addChat(name, message, system = false) {
    const p = document.createElement("p");
    p.textContent = system
      ? message
      : `${name}: ${message}`;

    if (system) p.className = "systemmsg";

    chatMessages.appendChild(p);

    while (chatMessages.children.length > 30) {
      chatMessages.removeChild(chatMessages.firstChild);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendPacket(packet) {
    for (const conn of state.connections.values()) {
      if (conn.open) {
        try {
          conn.send(packet);
        } catch (error) {
          console.warn("Could not send packet:", error);
        }
      }
    }
  }

  // ---------- Three.js world ----------
  function initWorld() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03070b);
    scene.fog = new THREE.FogExp2(0x071016, 0.035);

    camera = new THREE.PerspectiveCamera(
      76,
      window.innerWidth / window.innerHeight,
      0.08,
      150
    );

    camera.rotation.order = "YXZ";

    renderer = new THREE.WebGLRenderer({
      canvas: $("scene"),
      antialias: true,
      powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    if ("outputColorSpace" in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const ambient = new THREE.HemisphereLight(
      0x9cb8cf,
      0x090a0d,
      0.36
    );
    scene.add(ambient);

    const moon = new THREE.DirectionalLight(0x9ab8e2, 1.0);
    moon.position.set(-10, 20, 8);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.left = -24;
    moon.shadow.camera.right = 24;
    moon.shadow.camera.top = 24;
    moon.shadow.camera.bottom = -24;
    scene.add(moon);

    createMaterials();
    createSchool();
    createPlayer();
    createMonster();
    createKey();
    createExit();
    createRain();
    createAtmosphere();

    window.addEventListener("resize", resizeRenderer);
  }

  let materials = {};

  function createMaterials() {
    materials.floor = new THREE.MeshStandardMaterial({
      color: 0x303438,
      roughness: 0.34,
      metalness: 0.12
    });

    materials.wall = new THREE.MeshStandardMaterial({
      color: 0x424448,
      roughness: 0.94
    });

    materials.concrete = new THREE.MeshStandardMaterial({
      color: 0x252a2e,
      roughness: 0.98
    });

    materials.dark = new THREE.MeshStandardMaterial({
      color: 0x101518,
      roughness: 0.8
    });

    materials.glass = new THREE.MeshStandardMaterial({
      color: 0x172c38,
      roughness: 0.25,
      metalness: 0.5,
      emissive: 0x07131c,
      emissiveIntensity: 0.6
    });

    materials.door = new THREE.MeshStandardMaterial({
      color: 0x30221a,
      roughness: 0.86
    });

    materials.red = new THREE.MeshStandardMaterial({
      color: 0x4c090d,
      roughness: 0.8
    });

    materials.metal = new THREE.MeshStandardMaterial({
      color: 0x89929a,
      metalness: 0.8,
      roughness: 0.3
    });
  }

  function box(
    x, y, z,
    width, height, depth,
    material,
    options = {}
  ) {
    const geometry = new THREE.BoxGeometry(
      width, height, depth
    );

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    mesh.castShadow = options.castShadow !== false;
    mesh.receiveShadow = true;

    scene.add(mesh);

    if (options.solid !== false) {
      worldObjects.push({
        x, z,
        halfX: width / 2,
        halfZ: depth / 2,
        mesh
      });
    }

    return mesh;
  }

  function addLamp(x, y, z, color = 0xffbd78, intensity = 2.0) {
    const light = new THREE.PointLight(color, intensity, 12, 2);
    light.position.set(x, y, z);
    scene.add(light);

    const bulbMaterial = new THREE.MeshBasicMaterial({
      color
    });

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      bulbMaterial
    );

    bulb.position.set(x, y, z);
    scene.add(bulb);

    return light;
  }

  function createSchool() {
    // Main floor.
    box(
      0, -0.25, 0,
      36, 0.5, 70,
      materials.floor,
      { solid: false }
    );

    // Exterior walls.
    box(-18, 3, 0, 0.6, 6, 70, materials.concrete);
    box(18, 3, 0, 0.6, 6, 70, materials.concrete);
    box(0, 3, -35, 36, 6, 0.6, materials.concrete);
    box(0, 3, 35, 36, 6, 0.6, materials.concrete);

    // Long corridor ceiling.
    box(0, 6.2, 0, 36, 0.4, 70, materials.dark, {
      solid: false
    });

    // Central corridor walls, with passages at intervals.
    for (let z = -27; z <= 27; z += 12) {
      box(-5, 2, z, 0.35, 4, 7, materials.wall);
      box(5, 2, z, 0.35, 4, 7, materials.wall);
    }

    // Classroom partitions and desks.
    for (let z = -25; z <= 24; z += 10) {
      for (const side of [-1, 1]) {
        const x = side * random(9, 13);

        box(
          x, 0.65, z,
          2.0, 1.1, 1.2,
          materials.door
        );

        box(
          x + random(-1.5, 1.5),
          0.45,
          z + random(-2, 2),
          0.9, 0.9, 0.9,
          materials.concrete
        );

        // Windows on classroom walls.
        const windowMesh = box(
          side * 17.55, 3.4, z,
          0.08, 1.6, 3.2,
          materials.glass,
          { solid: false }
        );

        windowMesh.material = materials.glass;
      }
    }

    // Support pillars.
    for (let z = -28; z <= 28; z += 14) {
      for (const x of [-7.5, 7.5]) {
        box(
          x, 2.7, z,
          0.7, 5.4, 0.7,
          materials.concrete
        );
      }
    }

    // Ceiling lights.
    for (let z = -28; z <= 28; z += 14) {
      const light = addLamp(0, 5.65, z, 0xffc58c, 1.25);
      light.visible = Math.random() > 0.28;
    }

    // Broken-looking school entrance at the far end.
    box(0, 2.5, -34.3, 5, 5, 0.5, materials.door, {
      solid: false
    });

    // Rubble and abandoned objects.
    for (let i = 0; i < 65; i++) {
      const x = random(-16, 16);
      const z = random(-32, 32);

      // Keep the starting corridor relatively clear.
      if (Math.abs(x) < 3 && Math.abs(z) < 7) continue;

      const size = random(0.12, 0.55);
      const debris = box(
        x, size / 2 - 0.02, z,
        size * 1.6, size, size,
        Math.random() > 0.5
          ? materials.concrete
          : materials.dark,
        { solid: false }
      );

      debris.rotation.y = random(0, Math.PI);
    }

    // A few weak, flickering red lights.
    for (const z of [-25, 2, 23]) {
      const light = addLamp(0, 4.9, z, 0x9c3036, 0.7);
      light.userData.flicker = true;
    }
  }

  function createPlayer() {
    player = new THREE.Group();

    // Small visual body, visible when looking down.
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.8, 0.35),
      new THREE.MeshStandardMaterial({
        color: 0x111820,
        roughness: 0.9
      })
    );

    body.position.y = -0.75;
    player.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0x856e60,
        roughness: 0.9
      })
    );

    head.position.y = -0.2;
    player.add(head);

    // Flashlight points where the camera looks.
    flashlight = new THREE.SpotLight(
      0xffe9ca,
      55,
      28,
      Math.PI / 8,
      0.45,
      1.2
    );

    flashlight.position.set(0, 0, 0);
    flashlight.target.position.set(0, 0, -1);

    camera.add(flashlight);
    camera.add(flashlight.target);

    flashlightGlow = new THREE.PointLight(
      0xffdcb0,
      0.45,
      3
    );

    flashlightGlow.position.set(0, 0, 0);
    camera.add(flashlightGlow);

    scene.add(camera);
    camera.position.set(0, 1.65, 27);

    player.position.copy(camera.position);
    scene.add(player);

    // The camera is the first-person view.
    // Hide the body from normal view.
    body.visible = false;
    head.visible = false;
  }

  function createMonster() {
    monster = new THREE.Group();

    const black = new THREE.MeshStandardMaterial({
      color: 0x050607,
      roughness: 0.92
    });

    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.45, 1.25, 4, 8),
      black
    );

    torso.position.y = 1.45;
    monster.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 12),
      black
    );

    head.position.y = 2.45;
    monster.add(head);

    const eyeMaterial = new THREE.MeshBasicMaterial({
      color: 0xe32929
    });

    for (const x of [-0.12, 0.12]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 8, 8),
        eyeMaterial
      );

      eye.position.set(x, 2.49, -0.28);
      monster.add(eye);
    }

    // Long arms.
    for (const x of [-0.55, 0.55]) {
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.13, 1.1, 3, 6),
        black
      );

      arm.position.set(x, 1.3, 0);
      arm.rotation.z = x > 0 ? -0.16 : 0.16;
      monster.add(arm);
    }

    monster.position.set(0, 0, -23);
    scene.add(monster);

    monsterLight = new THREE.PointLight(0x8b1017, 1.3, 4);
    monsterLight.position.set(0, 2.2, 0);
    monster.add(monsterLight);
  }

  function createKey() {
    keyObject = new THREE.Group();

    const gold = new THREE.MeshStandardMaterial({
      color: 0xd8b45e,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x48300c,
      emissiveIntensity: 0.4
    });

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.045, 8, 18),
      gold
    );

    keyObject.add(ring);

    const shaft = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.48, 0.07),
      gold
    );

    shaft.position.y = -0.27;
    keyObject.add(shaft);

    const tooth = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.06, 0.07),
      gold
    );

    tooth.position.set(0.06, -0.43, 0);
    keyObject.add(tooth);

    keyObject.position.set(12, 1.1, -16);
    scene.add(keyObject);

    const light = new THREE.PointLight(0xe9bb54, 1.3, 4);
    keyObject.add(light);

    interactables.push({
      type: "key",
      object: keyObject,
      radius: 2.1
    });
  }

  function createExit() {
    exitObject = new THREE.Group();

    const frameMaterial = materials.metal;

    const left = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 4.6, 0.35),
      frameMaterial
    );
    left.position.set(-2, 2.3, 0);

    const right = left.clone();
    right.position.x = 2;

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.18, 0.35),
      frameMaterial
    );
    top.position.y = 4.6;

    exitObject.add(left, right, top);
    exitObject.position.set(0, 0, -33);
    scene.add(exitObject);

    interactables.push({
      type: "exit",
      object: exitObject,
      radius: 3.2
    });
  }

  function createRain() {
    const count = 1000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = random(-25, 25);
      positions[i * 3 + 1] = random(0, 18);
      positions[i * 3 + 2] = random(-40, 40);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
      color: 0x9aafc1,
      size: 0.035,
      transparent: true,
      opacity: 0.48
    });

    rain = new THREE.Points(geometry, material);
    scene.add(rain);
  }

  function createAtmosphere() {
    // Floating dust particles in the flashlight beam.
    const count = 160;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = random(-18, 18);
      positions[i * 3 + 1] = random(0, 5);
      positions[i * 3 + 2] = random(-34, 34);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const particles = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0x9baeb7,
        size: 0.045,
        transparent: true,
        opacity: 0.35
      })
    );

    scene.add(particles);
  }

  function resizeRenderer() {
    if (!renderer || !camera) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  }

  // ---------- Movement and collision ----------
  function collides(x, z) {
    // World boundaries.
    if (x < -17 || x > 17 || z < -34 || z > 34) {
      return true;
    }

    for (const item of worldObjects) {
      if (
        Math.abs(x - item.x) < item.halfX + playerRadius &&
        Math.abs(z - item.z) < item.halfZ + playerRadius
      ) {
        return true;
      }
    }

    return false;
  }

  function movePlayer(dx, dz) {
    const nextX = camera.position.x + dx;
    const nextZ = camera.position.z + dz;

    if (!collides(nextX, camera.position.z)) {
      camera.position.x = nextX;
    }

    if (!collides(camera.position.x, nextZ)) {
      camera.position.z = nextZ;
    }

    camera.position.y = 1.65;
  }

  function updateMovement(delta) {
    if (!state.running || state.dead || state.won) return;

    const forward = new THREE.Vector3(
      -Math.sin(camera.rotation.y),
      0,
      -Math.cos(camera.rotation.y)
    );

    const right = new THREE.Vector3(
      Math.cos(camera.rotation.y),
      0,
      -Math.sin(camera.rotation.y)
    );

    const direction = new THREE.Vector3();

    if (keys.KeyW || keys.ArrowUp) direction.add(forward);
    if (keys.KeyS || keys.ArrowDown) direction.sub(forward);
    if (keys.KeyD || keys.ArrowRight) direction.add(right);
    if (keys.KeyA || keys.ArrowLeft) direction.sub(right);

    const moving = direction.lengthSq() > 0;
    const sprinting =
      moving &&
      (keys.ShiftLeft || keys.ShiftRight) &&
      state.stamina > 0;

    if (moving) {
      direction.normalize();

      const speed = sprinting ? sprintSpeed : walkSpeed;
      movePlayer(
        direction.x * speed * delta,
        direction.z * speed * delta
      );
    }

    if (sprinting) {
      state.stamina = Math.max(0, state.stamina - 27 * delta);
    } else {
      state.stamina = Math.min(100, state.stamina + 16 * delta);
    }

    staminaBar.style.width = `${state.stamina}%`;

    // Slight first-person camera bob while moving.
    if (moving) {
      camera.position.y =
        1.65 + Math.sin(state.elapsed * (sprinting ? 15 : 10)) * 0.025;
    } else {
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        1.65,
        delta * 5
      );
    }
  }

  // ---------- Interactions ----------
  function nearestInteractable() {
    let best = null;
    let bestDistance = Infinity;

    for (const item of interactables) {
      if (!item.object.visible) continue;

      const distance = camera.position.distanceTo(
        item.object.position
      );

      if (distance < item.radius && distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }

    return best;
  }

  function interact() {
    if (!state.running || state.dead || state.won) return;

    const item = nearestInteractable();

    if (!item) {
      showToast("Nothing to interact with nearby.");
      return;
    }

    if (item.type === "key") {
      state.hasKey = true;
      scene.remove(keyObject);
      keyObject.visible = false;

      setObjective(
        "Escape the school",
        "Return to the main entrance."
      );

      document.querySelector(".slot:nth-child(2) label").textContent =
        "KEY FOUND";

      showToast("You found the old school key!");
      addChat("", "You picked up the key.", true);

      sendPacket({ type: "objective", hasKey: true });
    }

    if (item.type === "exit") {
      if (!state.hasKey) {
        showToast("The entrance is locked. Find the key first.");
        return;
      }

      winGame();
    }
  }

  function winGame() {
    state.won = true;
    state.running = false;
    document.exitPointerLock?.();

    winScreen.classList.remove("hidden");
    sendPacket({ type: "win" });
  }

  // ---------- Monster AI ----------
  function updateMonster(delta) {
    if (!monster || state.dead || state.won) return;

    const dx = camera.position.x - monster.position.x;
    const dz = camera.position.z - monster.position.z;
    const distance = Math.hypot(dx, dz);

    // The monster slowly hunts the player.
    if (distance > 1.65 && distance < 32) {
      const speed = distance < 8 ? 2.0 : 1.05;
      const stepX = (dx / Math.max(distance, 0.001)) * speed * delta;
      const stepZ = (dz / Math.max(distance, 0.001)) * speed * delta;

      const nextX = monster.position.x + stepX;
      const nextZ = monster.position.z + stepZ;

      if (!collides(nextX, monster.position.z)) {
        monster.position.x = nextX;
      }

      if (!collides(monster.position.x, nextZ)) {
        monster.position.z = nextZ;
      }

      monster.rotation.y = Math.atan2(dx, dz);
    }

    // Proximity damage with a cooldown.
    if (distance < 1.65 && performance.now() - state.lastDamage > 1200) {
      state.lastDamage = performance.now();
      state.health = Math.max(0, state.health - 12);
      updateHealth();

      damageFlash.style.opacity = "1";
      setTimeout(() => {
        damageFlash.style.opacity = "0";
      }, 180);

      showToast("The creature caught you!");

      if (state.health <= 0) {
        endGame();
      }
    }
  }

  function updateHealth() {
    healthBar.style.width = `${state.health}%`;
    healthNum.textContent = Math.ceil(state.health);

    if (state.health < 30) {
      healthBar.style.background = "#b72e36";
    } else {
      healthBar.style.background = "#b6d5c2";
    }
  }

  function useMedkit() {
    if (!state.running || state.dead || state.won) return;

    if (state.health >= 100) {
      showToast("Your health is already full.");
      return;
    }

    state.health = Math.min(100, state.health + 30);
    updateHealth();
    showToast("You used a medkit.");
  }

  function endGame() {
    state.dead = true;
    state.running = false;

    document.exitPointerLock?.();
    setObjective("You were caught", "Return to the menu and try again.");
    showToast("You were caught. Stay together next time.");
    addChat("", "Mission failed.", true);

    setTimeout(() => {
      winScreen.classList.remove("hidden");
      winScreen.querySelector(".eyebrow").textContent = "MISSION FAILED";
      winScreen.querySelector("h1").innerHTML = "YOU WERE CAUGHT<span>.</span>";
      winScreen.querySelector("p").textContent =
        "The school keeps its secrets.";
    }, 700);
  }

  // ---------- Flashlight ----------
  function toggleFlashlight() {
    state.flashlight = !state.flashlight;

    flashlight.visible = state.flashlight;
    flashlightGlow.visible = state.flashlight;

    showToast(state.flashlight ? "Flashlight ON" : "Flashlight OFF");

    sendPacket({
      type: "flashlight",
      enabled: state.flashlight
    });
  }

  // ---------- Peer-to-peer multiplayer ----------
  function setNetStatus(message) {
    netStatus.textContent = message;
  }

  function setRoomUI(room) {
    roomBadge.textContent = room ? `ROOM ${room}` : "SOLO SESSION";
    connectionDot.textContent = room ? "● ONLINE" : "● SOLO";
  }

  function makeRoomCode(id) {
    return id.slice(-6).toUpperCase();
  }

  function startPeer(isHost, code = "") {
    if (!window.Peer) {
      setNetStatus("PeerJS failed to load. Check your internet connection.");
      return;
    }

    cleanupNetwork();

    state.isHost = isHost;

    const peer = new Peer();

    state.peer = peer;

    peer.on("open", (id) => {
      if (isHost) {
        state.room = makeRoomCode(id);
        setRoomUI(state.room);
        setNetStatus(`Room created: ${state.room}. Share this code with your friend.`);
        showToast(`Room code: ${state.room}`, 5000);
      } else {
        const target = code.trim().toUpperCase();
        state.room = target;
        setRoomUI(target);

        const conn = peer.connect(target, {
          reliable: true,
          metadata: { name: state.name }
        });

        setupConnection(conn, true);
        setNetStatus("Connecting to the host...");
      }
    });

    peer.on("connection", (conn) => {
      if (!isHost) {
        conn.close();
        return;
      }

      if (state.connections.size >= 3) {
        conn.close();
        setNetStatus("This room is full. Maximum 4 players.");
        return;
      }

      setupConnection(conn, false);
    });

    peer.on("error", (error) => {
      console.warn("PeerJS:", error.type, error);

      const messages = {
        "peer-unavailable": "Room not found. Check the room code.",
        "network": "Network error. Check your connection.",
        "server-error": "The multiplayer service is unavailable."
      };

      setNetStatus(messages[error.type] || `Connection error: ${error.type}`);
    });

    peer.on("disconnected", () => {
      setNetStatus("Disconnected from the signaling service.");
    });
  }

  function setupConnection(conn, isOutgoing) {
    conn.on("open", () => {
      state.connections.set(conn.peer, conn);

      if (isOutgoing) {
        conn.send({
          type: "hello",
          name: state.name
        });
      } else {
        const name = conn.metadata?.name || "Survivor";
        conn.send({
          type: "welcome",
          name: state.name,
          hostPosition: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
          }
        });

        addChat("", `${name} joined the room.`, true);
      }

      setNetStatus("Connected! Share information and stay together.");
      updatePlayerList();

      sendPacket({
        type: "roster",
        players: [
          { name: state.name },
          ...Array.from(state.remotes.values()).map(p => ({
            name: p.name
          }))
        ]
      });
    });

    conn.on("data", (packet) => {
      handlePacket(conn, packet);
    });

    conn.on("close", () => {
      state.connections.delete(conn.peer);
      removeRemote(conn.peer);
      updatePlayerList();
      addChat("", "A survivor disconnected.", true);
    });

    conn.on("error", (error) => {
      console.warn("Connection error:", error);
    });
  }

  function handlePacket(conn, packet) {
    if (!packet || typeof packet !== "object") return;

    switch (packet.type) {
      case "hello": {
        const remote = getRemote(conn.peer, packet.name);
        remote.name = safeName(packet.name);
        conn.send({
          type: "welcome",
          name: state.name,
          position: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
          }
        });
        updatePlayerList();
        break;
      }

      case "welcome": {
        const remote = getRemote(conn.peer, packet.name);
        remote.name = safeName(packet.name);
        updatePlayerList();
        addChat("", `${remote.name} connected.`, true);
        break;
      }

      case "position": {
        const remote = getRemote(conn.peer, packet.name);

        if (Number.isFinite(packet.x) && Number.isFinite(packet.z)) {
          remote.target.set(packet.x, 0, packet.z);
          remote.yaw = Number.isFinite(packet.yaw) ? packet.yaw : 0;
        }
        break;
      }

      case "chat": {
        addChat(safeName(packet.name), safeMessage(packet.message));
        break;
      }

      case "objective": {
        if (packet.hasKey) {
          showToast("A teammate found the key!");
        }
        break;
      }

      case "flashlight":
        break;

      case "win":
        addChat("", "A teammate escaped!", true);
        break;
    }
  }

  function safeName(value) {
    if (typeof value !== "string") return "Survivor";
    return value.replace(/[<>]/g, "").slice(0, 16) || "Survivor";
  }

  function safeMessage(value) {
    if (typeof value !== "string") return "";
    return value.replace(/[<>]/g, "").slice(0, 140);
  }

  function getRemote(id, name = "Survivor") {
    if (state.remotes.has(id)) {
      return state.remotes.get(id);
    }

    const avatar = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.32, 0.8, 3, 6),
      new THREE.MeshStandardMaterial({
        color: 0x25394b,
        roughness: 0.85
      })
    );

    body.position.y = 1.05;
    avatar.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0x9a806b,
        roughness: 0.9
      })
    );

    head.position.y = 1.72;
    avatar.add(head);

    const light = new THREE.PointLight(0x72baff, 0.5, 2);
    light.position.y = 1.8;
    avatar.add(light);

    scene.add(avatar);

    const remote = {
      id,
      name: safeName(name),
      avatar,
      target: new THREE.Vector3(0, 0, 0),
      yaw: 0
    };

    state.remotes.set(id, remote);
    updatePlayerList();

    return remote;
  }

  function removeRemote(id) {
    const remote = state.remotes.get(id);
    if (!remote) return;

    scene.remove(remote.avatar);
    state.remotes.delete(id);
  }

  function updatePlayerList() {
    playerList.replaceChildren();

    const own = document.createElement("div");
    own.className = "playerline";
    own.innerHTML = "<i></i><span></span><b>YOU</b>";
    own.querySelector("span").textContent = state.name;
    playerList.appendChild(own);

    for (const remote of state.remotes.values()) {
      const line = document.createElement("div");
      line.className = "playerline remote";
      line.innerHTML = "<i></i><span></span><b>ONLINE</b>";
      line.querySelector("span").textContent = remote.name;
      playerList.appendChild(line);
    }
  }

  function cleanupNetwork() {
    for (const conn of state.connections.values()) {
      try { conn.close(); } catch {}
    }

    state.connections.clear();

    for (const id of state.remotes.keys()) {
      removeRemote(id);
    }

    if (state.peer) {
      try { state.peer.destroy(); } catch {}
    }

    state.peer = null;
    state.room = null;
    state.isHost = false;
    setRoomUI(null);
  }

  // ---------- Chat ----------
  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const message = safeMessage(chatInput.value.trim());
    if (!message) return;

    const now = Date.now();

    if (now - lastChatTime < 500) return;
    lastChatTime = now;

    addChat(state.name, message);

    sendPacket({
      type: "chat",
      name: state.name,
      message
    });

    chatInput.value = "";
  });

  // ---------- Mouse and keyboard ----------
  function requestPointerLock() {
    if (state.running && !state.dead && !state.won) {
      $("scene").requestPointerLock?.();
    }
  }

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === $("scene")) {
      prompt.textContent = "";
    } else if (state.running && !state.dead && !state.won) {
      prompt.textContent = "CLICK TO LOOK AROUND";
    }
  });

  document.addEventListener("mousemove", (event) => {
    if (
      document.pointerLockElement !== $("scene") ||
      !state.running ||
      state.dead ||
      state.won
    ) {
      return;
    }

    camera.rotation.y -= event.movementX * 0.0022;
    camera.rotation.x -= event.movementY * 0.0022;

    camera.rotation.x = clamp(
      camera.rotation.x,
      -Math.PI / 2 + 0.05,
      Math.PI / 2 - 0.05
    );
  });

  $("scene").addEventListener("click", requestPointerLock);

  document.addEventListener("keydown", (event) => {
    keys[event.code] = true;

    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
        .includes(event.code)
    ) {
      event.preventDefault();
    }

    if (event.repeat) return;

    if (event.code === "KeyF") toggleFlashlight();
    if (event.code === "KeyE") interact();
    if (event.code === "KeyQ") useMedkit();
    if (event.code === "Escape") prompt.textContent = "CLICK TO LOOK AROUND";
  });

  document.addEventListener("keyup", (event) => {
    keys[event.code] = false;
  });

  window.addEventListener("blur", () => {
    for (const code of Object.keys(keys)) keys[code] = false;
  });

  // ---------- Session startup ----------
  function resetGame() {
    state.running = true;
    state.dead = false;
    state.won = false;
    state.health = 100;
    state.stamina = 100;
    state.flashlight = true;
    state.hasKey = false;
    state.elapsed = 0;
    state.lastDamage = 0;

    camera.position.set(0, 1.65, 27);
    camera.rotation.set(0, 0, 0);

    monster.position.set(0, 0, -23);
    keyObject.visible = true;
    keyObject.position.set(12, 1.1, -16);

    flashlight.visible = true;
    flashlightGlow.visible = true;

    healthBar.style.width = "100%";
    healthNum.textContent = "100";
    staminaBar.style.width = "100%";

    document.querySelector(".slot:nth-child(2) label").textContent = "KEY";
    winScreen.classList.add("hidden");

    winScreen.querySelector(".eyebrow").textContent = "MISSION COMPLETE";
    winScreen.querySelector("h1").innerHTML = "YOU MADE IT<span>.</span>";
    winScreen.querySelector("p").textContent =
      "The school is behind you. For now.";

    setObjective("Find the key", "Search the abandoned school.");
    prompt.textContent = "CLICK TO LOOK AROUND";

    chatMessages.replaceChildren();
    addChat("", "You hear rain tapping against the windows...", true);

    gameStartedAt = performance.now();
  }

  function enterGame() {
    state.name = safeName(playerName.value.trim() || "HDP_Gamer");
    playerName.value = state.name;

    menu.style.display = "none";
    game.style.display = "block";

    if (!renderer) {
      try {
        initWorld();
      } catch (error) {
        console.error(error);
        alert("The 3D game could not start. Check the browser console.");
        menu.style.display = "grid";
        game.style.display = "none";
        return;
      }
    }

    resetGame();
    requestPointerLock();
  }

  soloBtn.addEventListener("click", () => {
    cleanupNetwork();
    enterGame();
    addChat("", "You entered alone. Find the key and escape.", true);
  });

  hostBtn.addEventListener("click", () => {
    state.name = safeName(playerName.value.trim() || "HDP_Gamer");
    enterGame();
    startPeer(true);
  });

  joinBtn.addEventListener("click", () => {
    const code = roomCode.value.trim();

    if (!code) {
      setNetStatus("Enter your friend's room code first.");
      return;
    }

    state.name = safeName(playerName.value.trim() || "HDP_Gamer");
    enterGame();
    startPeer(false, code);
  });

  $("againBtn").addEventListener("click", () => {
    resetGame();
    requestPointerLock();
  });

  $("menuBtn").addEventListener("click", () => {
    state.running = false;
    document.exitPointerLock?.();

    cleanupNetwork();
    game.style.display = "none";
    menu.style.display = "grid";
  });

  // ---------- Main update loop ----------
  function updateRemotes(delta) {
    for (const remote of state.remotes.values()) {
      remote.avatar.position.lerp(remote.target, Math.min(1, delta * 8));
      remote.avatar.rotation.y = remote.yaw;
    }
  }

  function updateEnvironment(delta) {
    state.elapsed += delta;

    // Animate the rain particles.
    if (rain) {
      const positions = rain.geometry.attributes.position;

      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i) - delta * 12;

        if (y < 0) y = random(12, 18);

        positions.setY(i, y);
      }

      positions.needsUpdate = true;
    }

    // Flicker a few lights for atmosphere.
    for (const child of scene.children) {
      if (
        child.isPointLight &&
        child.userData.flicker
      ) {
        child.intensity = Math.random() > 0.975
          ? 0.1
          : 0.7;
      }
    }

    keyObject.rotation.y += delta * 0.7;
    keyObject.position.y = 1.1 + Math.sin(state.elapsed * 2) * 0.12;

    monster.children.forEach((part, index) => {
      if (index === 0) {
        part.rotation.z = Math.sin(state.elapsed * 3) * 0.04;
      }
    });
  }

  function updateNetwork() {
    if (!state.peer || state.connections.size === 0) return;

    const now = performance.now();

    if (now - state.lastBroadcast < 80) return;
    state.lastBroadcast = now;

    sendPacket({
      type: "position",
      name: state.name,
      x: camera.position.x,
      z: camera.position.z,
      yaw: camera.rotation.y
    });
  }

  function loop() {
    requestAnimationFrame(loop);

    if (!renderer || !scene || !camera) return;

    const delta = Math.min(clock.getDelta(), 0.05);

    if (state.running && !state.dead && !state.won) {
      updateMovement(delta);
      updateMonster(delta);
      updateRemotes(delta);
      updateEnvironment(delta);
      updateNetwork();

      const nearby = nearestInteractable();

      if (nearby) {
        prompt.textContent = nearby.type === "key"
          ? "[ E ] PICK UP KEY"
          : state.hasKey
            ? "[ E ] UNLOCK EXIT"
            : "THE DOOR IS LOCKED";
      } else if (document.pointerLockElement === $("scene")) {
        prompt.textContent = "";
      }
    } else {
      updateEnvironment(delta);
    }

    renderer.render(scene, camera);
  }

  // ---------- Start ----------
  loop();
})();
