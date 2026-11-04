import * as THREE from 'three';
import './visual.css';

// --------------------------------------------------
// DADOS DA CARREIRA
// --------------------------------------------------

type Country = {
  name: string;
  flag: string;
  level: string;
};

const countries: Country[] = [
  { name: 'BRASIL', flag: '🇧🇷', level: 'América do Sul' },
  { name: 'PORTUGAL', flag: '🇵🇹', level: 'Europa' },
  { name: 'ARGENTINA', flag: '🇦🇷', level: 'América do Sul' },
  { name: 'JAPÃO', flag: '🇯🇵', level: 'Ásia' },
  { name: 'ALEMANHA', flag: '🇩🇪', level: 'Europa' },
  { name: 'CANADÁ', flag: '🇨🇦', level: 'América do Norte' }
];

const opponents = [
  { name: 'NEPAL', flag: '🇳🇵', skill: 0.35 },
  { name: 'ARGENTINA', flag: '🇦🇷', skill: 0.43 },
  { name: 'PORTUGAL', flag: '🇵🇹', skill: 0.52 },
  { name: 'ALEMANHA', flag: '🇩🇪', skill: 0.62 },
  { name: 'JAPÃO', flag: '🇯🇵', skill: 0.72 },
  { name: 'COREIA DO SUL', flag: '🇰🇷', skill: 0.82 },
  { name: 'FRANÇA', flag: '🇫🇷', skill: 0.91 },
  { name: 'CHINA', flag: '🇨🇳', skill: 0.98 }
];

// --------------------------------------------------
// ELEMENTOS DA INTERFACE
// --------------------------------------------------

const $ = (id: string) => document.getElementById(id)!;

const homeScreen = $('home-screen');
const countryScreen = $('country-screen');
const gameScreen = $('game-screen');

const playButton = $('play-button');
const startCareerButton = $('start-career') as HTMLButtonElement;
const backHomeButton = $('back-home');
const countryGrid = $('country-grid');

const playerScoreElement = $('player-score');
const opponentScoreElement = $('opponent-score');
const opponentNameElement = $('opponent-name');
const opponentFlagElement = $('opponent-flag');
const playerCountryElement = $('player-country');
const playerFlagElement = $('player-flag');
const gameMessage = $('game-message');

const pointOverlay = $('point-overlay');
const matchOverlay = $('match-overlay');

let selectedCountry: Country | null = null;
let opponentIndex = 0;
let playerScore = 0;
let opponentScore = 0;
let matchFinished = false;
let pointInProgress = false;

// --------------------------------------------------
// NAVEGAÇÃO
// --------------------------------------------------

function showScreen(screen: HTMLElement) {
  document.querySelectorAll('.screen').forEach(element => {
    element.classList.remove('active');
  });

  screen.classList.add('active');
}

playButton.addEventListener('click', () => {
  showScreen(countryScreen);
});

backHomeButton.addEventListener('click', () => {
  showScreen(homeScreen);
});

countries.forEach(country => {
  const card = document.createElement('button');
  card.className = 'country-card';

  card.innerHTML = `
    <span class="country-flag">${country.flag}</span>
    <span>
      <strong>${country.name}</strong>
      <small>${country.level}</small>
    </span>
  `;

  card.addEventListener('click', () => {
    selectedCountry = country;

    document.querySelectorAll('.country-card').forEach(item => {
      item.classList.remove('selected');
    });

    card.classList.add('selected');
    startCareerButton.disabled = false;
  });

  countryGrid.appendChild(card);
});

startCareerButton.addEventListener('click', () => {
  if (!selectedCountry) return;

  opponentIndex = 0;
  showScreen(gameScreen);
  updateMatchHeader();
  resetMatch();
});

function updateMatchHeader() {
  const opponent = opponents[opponentIndex];

  playerCountryElement.textContent = selectedCountry?.name ?? 'BRASIL';
  playerFlagElement.textContent = selectedCountry?.flag ?? '🇧🇷';

  opponentNameElement.textContent = opponent.name;
  opponentFlagElement.textContent = opponent.flag;

  $('round-label').textContent = `RODADA ${opponentIndex + 1}`;
}

// --------------------------------------------------
// CENA 3D
// --------------------------------------------------

const container = $('game-canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#101c29');
scene.fog = new THREE.Fog('#101c29', 15, 30);

const camera = new THREE.PerspectiveCamera(
  43,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);

camera.position.set(0, 5.2, 10.5);
camera.lookAt(0, 1.1, -0.4);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

// --------------------------------------------------
// ILUMINAÇÃO
// --------------------------------------------------

const ambientLight = new THREE.HemisphereLight(
  0xc8e5ff,
  0x18232d,
  2.1
);

scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 3.0);
mainLight.position.set(-4, 9, 5);
mainLight.castShadow = true;
mainLight.shadow.mapSize.set(2048, 2048);
scene.add(mainLight);

const backLight = new THREE.PointLight(0x48e6c0, 45, 15);
backLight.position.set(0, 4, -5);
scene.add(backLight);

// --------------------------------------------------
// MATERIAIS
// --------------------------------------------------

const floorMaterial = new THREE.MeshStandardMaterial({
  color: '#152432',
  roughness: 0.9
});

const tableMaterial = new THREE.MeshStandardMaterial({
  color: '#087c83',
  roughness: 0.55
});

const whiteMaterial = new THREE.MeshStandardMaterial({
  color: '#eaf3f4',
  roughness: 0.7
});

const darkMaterial = new THREE.MeshStandardMaterial({
  color: '#17222c',
  roughness: 0.65
});

const paddleMaterial = new THREE.MeshStandardMaterial({
  color: '#d52f3d',
  roughness: 0.55
});

const ballMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.35
});

// --------------------------------------------------
// PISO E AMBIENTE
// --------------------------------------------------

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  floorMaterial
);

floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.04;
floor.receiveShadow = true;
scene.add(floor);

// Linhas decorativas no ambiente
for (let i = -5; i <= 5; i++) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.01, 13),
    new THREE.MeshBasicMaterial({ color: '#263d4b' })
  );

  line.position.set(i * 1.3, 0.01, 0);
  scene.add(line);
}

// --------------------------------------------------
// MESA
// --------------------------------------------------

const table = new THREE.Mesh(
  new THREE.BoxGeometry(4.5, 0.16, 8),
  tableMaterial
);

table.position.set(0, 1, 0);
table.castShadow = true;
table.receiveShadow = true;
scene.add(table);

// Linhas brancas da mesa
function addTableLine(
  x: number,
  z: number,
  width: number,
  depth: number
) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.012, depth),
    whiteMaterial
  );

  line.position.set(x, 1.087, z);
  scene.add(line);
}

addTableLine(0, -3.94, 4.4, 0.045);
addTableLine(0, 3.94, 4.4, 0.045);
addTableLine(-2.22, 0, 0.045, 7.9);
addTableLine(2.22, 0, 0.045, 7.9);
addTableLine(0, 0, 0.025, 7.9);

// Pés da mesa
for (const x of [-1.8, 1.8]) {
  for (const z of [-3, 3]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 1, 0.16),
      darkMaterial
    );

    leg.position.set(x, 0.48, z);
    leg.castShadow = true;
    scene.add(leg);
  }
}

// --------------------------------------------------
// REDE
// --------------------------------------------------

const netPostMaterial = new THREE.MeshStandardMaterial({
  color: '#d8e0e5'
});

const netPostGeometry = new THREE.CylinderGeometry(
  0.035,
  0.035,
  0.28,
  12
);

for (const x of [-2.28, 2.28]) {
  const post = new THREE.Mesh(netPostGeometry, netPostMaterial);
  post.position.set(x, 1.22, 0);
  scene.add(post);
}

const net = new THREE.Mesh(
  new THREE.BoxGeometry(4.5, 0.28, 0.035),
  new THREE.MeshStandardMaterial({
    color: '#d8e3e8',
    transparent: true,
    opacity: 0.72,
    roughness: 1
  })
);

net.position.set(0, 1.23, 0);
scene.add(net);

const netTop = new THREE.Mesh(
  new THREE.BoxGeometry(4.55, 0.035, 0.07),
  whiteMaterial
);

netTop.position.set(0, 1.39, 0);
scene.add(netTop);

// --------------------------------------------------
// RAQUETES
// --------------------------------------------------

function createPaddle(color: string) {
  const group = new THREE.Group();

  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.31, 32),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55
    })
  );

  face.castShadow = true;
  group.add(face);

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.43, 0.09),
    new THREE.MeshStandardMaterial({ color: '#b9824e' })
  );

  handle.position.y = -0.37;
  group.add(handle);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.31, 0.025, 8, 32),
    darkMaterial
  );

  group.add(rim);

  return group;
}

const playerPaddle = createPaddle('#e83e50');
playerPaddle.position.set(0, 1.55, 3.35);
scene.add(playerPaddle);

const opponentPaddle = createPaddle('#202b38');
opponentPaddle.position.set(0, 1.55, -3.35);
scene.add(opponentPaddle);

// --------------------------------------------------
// BOLA
// --------------------------------------------------

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.105, 24, 24),
  ballMaterial
);

ball.castShadow = true;
scene.add(ball);

const ballShadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.18, 24),
  new THREE.MeshBasicMaterial({
    color: '#000000',
    transparent: true,
    opacity: 0.25
  })
);

ballShadow.rotation.x = -Math.PI / 2;
ballShadow.position.y = 1.09;
scene.add(ballShadow);

// --------------------------------------------------
// ESTADO DA PARTIDA
// --------------------------------------------------

type BallState = {
  velocity: THREE.Vector3;
  active: boolean;
  bounces: number;
  lastHit: 'player' | 'opponent' | null;
  spin: number;
};

const ballState: BallState = {
  velocity: new THREE.Vector3(),
  active: false,
  bounces: 0,
  lastHit: null,
  spin: 0
};

const playerPosition = new THREE.Vector2(0, 1.55);
const opponentPosition = new THREE.Vector2(0, 1.55);

let mouseX = 0;
let mouseY = 0;
let previousMouseX = 0;
let previousMouseY = 0;
let mouseSpeed = 0;
let lastMouseTime = 0;
let waitingForServe = true;
let pointCooldown = false;

// --------------------------------------------------
// CONTROLE PELO MOUSE
// --------------------------------------------------

renderer.domElement.addEventListener('mousemove', event => {
  const rect = renderer.domElement.getBoundingClientRect();

  const normalizedX = (event.clientX - rect.left) / rect.width;
  const normalizedY = (event.clientY - rect.top) / rect.height;

  mouseX = (normalizedX - 0.5) * 4.1;
  mouseY = 2.65 - normalizedY * 2.25;

  const now = performance.now();
  const elapsed = Math.max(now - lastMouseTime, 1);

  const dx = mouseX - previousMouseX;
  const dy = mouseY - previousMouseY;

  mouseSpeed = Math.sqrt(dx * dx + dy * dy) / elapsed;

  previousMouseX = mouseX;
  previousMouseY = mouseY;
  lastMouseTime = now;
});

renderer.domElement.addEventListener('mouseleave', () => {
  mouseSpeed = 0;
});

renderer.domElement.addEventListener('click', () => {
  if (waitingForServe && !pointInProgress && !matchFinished) {
    serveBall();
  }
});

// --------------------------------------------------
// SAQUE
// --------------------------------------------------

function serveBall() {
  if (!waitingForServe || pointInProgress) return;

  waitingForServe = false;
  ballState.active = true;
  ballState.bounces = 0;
  ballState.lastHit = 'player';

  ball.position.set(
    playerPaddle.position.x,
    1.85,
    2.75
  );

  ballState.velocity.set(
    (Math.random() - 0.5) * 1.1,
    2.3,
    -5.3
  );

  gameMessage.innerHTML = `
    <strong>EM JOGO</strong>
    <span>Prepare-se para receber!</span>
  `;

  $('game-hint').textContent =
    'MOUSE RÁPIDO = ATAQUE | MOUSE LENTO = DEVOLUÇÃO CONTROLADA';
}

// --------------------------------------------------
// MOVIMENTO E FÍSICA
// --------------------------------------------------

const gravity = -8.5;
const tableHeight = 1.09;

function updateBall(delta: number) {
  if (!ballState.active || pointInProgress) return;

  const velocity = ballState.velocity;

  velocity.y += gravity * delta;

  // Efeito lateral de rotação
  velocity.x += ballState.spin * delta;
  ballState.spin *= 0.992;

  ball.position.addScaledVector(velocity, delta);

  // Efeito visual de rotação da bola
  ball.rotation.x += velocity.z * delta * 1.7;
  ball.rotation.z += velocity.x * delta * 1.7;

  ballShadow.position.x = ball.position.x;
  ballShadow.position.z = ball.position.z;

  const heightAboveTable = ball.position.y - tableHeight;

  // Colisão com a superfície da mesa
  if (
    ball.position.y <= tableHeight + 0.105 &&
    ball.position.y > tableHeight - 0.03 &&
    Math.abs(ball.position.x) < 2.2 &&
    Math.abs(ball.position.z) < 3.95 &&
    velocity.y < 0
  ) {
    ball.position.y = tableHeight + 0.106;
    velocity.y = Math.abs(velocity.y) * 0.82;
    velocity.x *= 0.94;
    velocity.z *= 0.985;

    ballState.bounces++;

    // Dois quiques no mesmo lado encerram a jogada
    if (ballState.bounces >= 2) {
      awardPoint(
        ballState.lastHit === 'player' ? 'opponent' : 'player',
        'A bola quicou duas vezes!'
      );
      return;
    }
  }

  // Rede: a bola não pode atravessar a rede por baixo
  if (
    Math.abs(ball.position.z) < 0.075 &&
    ball.position.y < 1.43 &&
    ball.position.y > 1.05
  ) {
    velocity.z *= -0.45;
    velocity.y = Math.max(velocity.y, 1.1);
    ball.position.z = Math.sign(velocity.z) * 0.09;
  }

  // Bola saiu pelas laterais
  if (Math.abs(ball.position.x) > 2.7) {
    awardPoint(
      ballState.lastHit === 'player' ? 'opponent' : 'player',
      'A bola saiu pela lateral!'
    );
    return;
  }

  // Bola saiu pelo fundo da mesa
  if (ball.position.z > 4.2 || ball.position.z < -4.2) {
    awardPoint(
      ballState.lastHit === 'player' ? 'opponent' : 'player',
      'A bola saiu da mesa!'
    );
    return;
  }

  // Bola caiu no chão
  if (ball.position.y < 0.15) {
    awardPoint(
      ballState.lastHit === 'player' ? 'opponent' : 'player',
      'A bola caiu no chão!'
    );
    return;
  }

  checkPaddleCollisions(delta);
}

// --------------------------------------------------
// COLISÕES COM AS RAQUETES
// --------------------------------------------------

function checkPaddleCollisions(delta: number) {
  const playerDistance = ball.position.distanceTo(
    new THREE.Vector3(
      playerPaddle.position.x,
      playerPaddle.position.y,
      playerPaddle.position.z
    )
  );

  if (
    ballState.velocity.z > 0 &&
    ball.position.z > 2.95 &&
    ball.position.z < 3.55 &&
    playerDistance < 0.47 &&
    ballState.lastHit !== 'player'
  ) {
    hitWithPlayer();
  }

  const opponentDistance = ball.position.distanceTo(
    new THREE.Vector3(
      opponentPaddle.position.x,
      opponentPaddle.position.y,
      opponentPaddle.position.z
    )
  );

  if (
    ballState.velocity.z < 0 &&
    ball.position.z < -2.95 &&
    ball.position.z > -3.55 &&
    opponentDistance < 0.47 &&
    ballState.lastHit !== 'opponent'
  ) {
    hitWithOpponent();
  }
}

function hitWithPlayer() {
  const incomingSpeed = ballState.velocity.length();

  const speed = THREE.MathUtils.clamp(mouseSpeed * 1000, 0, 1.8);

  const offsetX = ball.position.x - playerPaddle.position.x;
  const offsetY = ball.position.y - playerPaddle.position.y;

  const aim = THREE.MathUtils.clamp(
    offsetX * 1.5 + mouseX * 0.18,
    -2.1,
    2.1
  );

  const attack = speed > 0.75;
  const defense = speed < 0.12;

  let forwardSpeed = 5.0;
  let verticalSpeed = 1.6;

  if (attack) {
    forwardSpeed = 6.5 + speed * 1.2;
    verticalSpeed = 1.2 + Math.random() * 0.5;
  } else if (defense) {
    forwardSpeed = 4.2;
    verticalSpeed = 2.4;
  } else {
    forwardSpeed = 5.1;
    verticalSpeed = 1.8;
  }

  // Uma bola muito rápida exige reação melhor
  if (incomingSpeed > 8 && defense) {
    forwardSpeed = 4.6;
    verticalSpeed = 2.8;
  }

  ballState.velocity.set(
    aim * 1.15,
    verticalSpeed + offsetY * 0.4,
    -forwardSpeed
  );

  // Movimento lateral rápido pode adicionar efeito
  ballState.spin = THREE.MathUtils.clamp(
    (mouseX - previousMouseX) * 1.4,
    -2.5,
    2.5
  );

  ballState.lastHit = 'player';
  ballState.bounces = 0;
  mouseSpeed = 0;

  gameMessage.innerHTML = `
    <strong>${attack ? 'ATAQUE!' : defense ? 'DEFESA!' : 'DEVOLUÇÃO!'}</strong>
    <span>${attack ? 'Golpe ofensivo' : defense ? 'Bloqueio controlado' : 'Bola devolvida'}</span>
  `;
}

function hitWithOpponent() {
  const opponent = opponents[opponentIndex];
  const skill = opponent.skill;

  const missChance = 0.28 * (1 - skill);

  if (Math.random() < missChance) {
    awardPoint('player', 'O adversário não conseguiu alcançar a bola!');
    return;
  }

  const targetX = THREE.MathUtils.clamp(
    playerPaddle.position.x * (0.5 + skill * 0.25) +
    (Math.random() - 0.5) * (1.4 - skill),
    -1.85,
    1.85
  );

  const power = 4.3 + skill * 2.0;

  ballState.velocity.set(
    (targetX - ball.position.x) * 0.65,
    1.3 + skill * 0.7,
    power
  );

  ballState.lastHit = 'opponent';
  ballState.bounces = 0;

  gameMessage.innerHTML = `
    <strong>DEVOLVIDA!</strong>
    <span>O adversário respondeu.</span>
  `;
}

// --------------------------------------------------
// INTELIGÊNCIA ARTIFICIAL DO ADVERSÁRIO
// --------------------------------------------------

function updateOpponent(delta: number) {
  if (!ballState.active || pointInProgress) return;

  const opponent = opponents[opponentIndex];
  const skill = opponent.skill;

  let targetX = 0;
  let targetY = 1.55;

  if (ballState.velocity.z < 0) {
    const timeToReach = Math.max(
      0,
      (Math.abs(ball.position.z) - 3.25) /
      Math.max(Math.abs(ballState.velocity.z), 0.1)
    );

    targetX = ball.position.x + ballState.velocity.x * timeToReach;
    targetY = ball.position.y + ballState.velocity.y * timeToReach;
  }

  targetX = THREE.MathUtils.clamp(targetX, -1.9, 1.9);
  targetY = THREE.MathUtils.clamp(targetY, 1.25, 2.35);

  const movement = (1.5 + skill * 4.2) * delta;

  opponentPosition.x = THREE.MathUtils.damp(
    opponentPosition.x,
    targetX,
    movement,
    delta
  );

  opponentPosition.y = THREE.MathUtils.damp(
    opponentPosition.y,
    targetY,
    movement,
    delta
  );

  opponentPaddle.position.x = opponentPosition.x;
  opponentPaddle.position.y = opponentPosition.y;
}

// --------------------------------------------------
// PONTUAÇÃO
// --------------------------------------------------

function awardPoint(winner: 'player' | 'opponent', reason: string) {
  if (pointInProgress || matchFinished) return;

  pointInProgress = true;
  ballState.active = false;

  if (winner === 'player') {
    playerScore++;
  } else {
    opponentScore++;
  }

  playerScoreElement.textContent = String(playerScore);
  opponentScoreElement.textContent = String(opponentScore);

  $('point-title').textContent =
    winner === 'player' ? 'PONTO SEU!' : 'PONTO DO ADVERSÁRIO!';

  $('point-description').textContent = reason;

  $('point-eyebrow').textContent =
    `${playerScore}  —  ${opponentScore}`;

  pointOverlay.classList.remove('hidden');

  const playerWon = playerScore >= 11 && playerScore - opponentScore >= 2;
  const opponentWon = opponentScore >= 11 && opponentScore - playerScore >= 2;

  if (playerWon || opponentWon) {
    matchFinished = true;

    setTimeout(() => {
      pointOverlay.classList.add('hidden');

      $('match-title').textContent =
        playerWon ? 'VITÓRIA!' : 'DERROTA!';

      $('match-description').textContent = playerWon
        ? `Você venceu ${opponents[opponentIndex].name} por ${playerScore} a ${opponentScore}.`
        : `Você perdeu para ${opponents[opponentIndex].name}. Treine e tente novamente!`;

      $('next-match-button').textContent =
        playerWon && opponentIndex < opponents.length - 1
          ? 'PRÓXIMO ADVERSÁRIO →'
          : 'VOLTAR AO INÍCIO';

      matchOverlay.classList.remove('hidden');
    }, 900);
  }
}

$('continue-button').addEventListener('click', () => {
  pointOverlay.classList.add('hidden');

  if (!matchFinished) {
    pointInProgress = false;
    prepareNextServe();
  }
});

$('next-match-button').addEventListener('click', () => {
  matchOverlay.classList.add('hidden');

  if (
    playerScore > opponentScore &&
    opponentIndex < opponents.length - 1
  ) {
    opponentIndex++;
    updateMatchHeader();
    resetMatch();
  } else {
    showScreen(countryScreen);
    matchFinished = false;
  }
});

// --------------------------------------------------
// PREPARAR PRÓXIMO SAQUE
// --------------------------------------------------

function prepareNextServe() {
  waitingForServe = true;

  ball.position.set(0, 1.75, 2.75);
  ballState.velocity.set(0, 0, 0);
  ballState.lastHit = null;
  ballState.bounces = 0;
  ballState.spin = 0;

  gameMessage.innerHTML = `
    <strong>PRÓXIMO PONTO</strong>
    <span>Clique na mesa para sacar</span>
  `;

  $('game-hint').textContent = 'CLIQUE NA ÁREA DO JOGO PARA SACAR';
}

function resetMatch() {
  playerScore = 0;
  opponentScore = 0;
  matchFinished = false;
  pointInProgress = false;
  waitingForServe = true;

  playerScoreElement.textContent = '0';
  opponentScoreElement.textContent = '0';

  playerPosition.set(0, 1.55);
  opponentPosition.set(0, 1.55);

  playerPaddle.position.set(0, 1.55, 3.35);
  opponentPaddle.position.set(0, 1.55, -3.35);

  ball.position.set(0, 1.75, 2.75);
  ballState.velocity.set(0, 0, 0);
  ballState.active = false;
  ballState.bounces = 0;
  ballState.lastHit = null;
  ballState.spin = 0;

  pointOverlay.classList.add('hidden');
  matchOverlay.classList.add('hidden');

  gameMessage.innerHTML = `
    <strong>PREPARE-SE</strong>
    <span>Clique para sacar</span>
  `;

  $('game-hint').textContent = 'MOVA O MOUSE PARA CONTROLAR SUA RAQUETE';
}

// --------------------------------------------------
// ATUALIZAÇÃO DA RAQUETE DO JOGADOR
// --------------------------------------------------

function updatePlayer() {
  playerPosition.x = THREE.MathUtils.clamp(mouseX, -1.9, 1.9);
  playerPosition.y = THREE.MathUtils.clamp(mouseY, 1.25, 2.45);

  playerPaddle.position.x = THREE.MathUtils.lerp(
    playerPaddle.position.x,
    playerPosition.x,
    0.28
  );

  playerPaddle.position.y = THREE.MathUtils.lerp(
    playerPaddle.position.y,
    playerPosition.y,
    0.28
  );

  // Inclinação da raquete acompanha o movimento lateral
  playerPaddle.rotation.z = THREE.MathUtils.clamp(
    (playerPosition.x - playerPaddle.position.x) * 0.4,
    -0.3,
    0.3
  );
}

// --------------------------------------------------
// ANIMAÇÃO
// --------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.035);

  updatePlayer();
  updateOpponent(delta);
  updateBall(delta);

  renderer.render(scene, camera);
}

animate();

// --------------------------------------------------
// REDIMENSIONAMENTO
// --------------------------------------------------

window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (width === 0 || height === 0) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});
