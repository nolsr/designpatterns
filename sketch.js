// CONFIG
const numberOfLayers = 7;
const framerate = 120;
const minIntervalSize = 25;
const maxIntervalSize = 5; // 1: 1 Second, 10: 0.1 Seconds
const modes = ['s', '1', '2', '3', '4'];
const minActiveFor = 150;
const maxActiveFor = 1500;
const soundfile = './beat.mp3';
const volume = 0.25;
const charInactive = '·';
const charActive = '|';

let audio = null;
let audioSource = null;
let analyser = null;
let context = null;
let zoom = null;

let zoomActive = true;
let intervalSize = 25;
let activeFor = 250;
let mode = '';
let frameCounter = 0;
let intervalsPassed = 0;
let layers = new Array(numberOfLayers).fill(null);
let map = new Array(numberOfLayers).fill(0).map(() => new Array(9).fill(0).map(() => new Array(16).fill(false))); // [layer, row, column]
let mapPrevious = structuredClone(map);
let dataArray = null; // 16 langes array mit werten von 0 bis 255 vom analyser

function setup() {
  noCanvas();
  createGrid(16, 9);
  zoom = select('#grids')
  for (let i = 0; i < numberOfLayers; i++) {
    layers[i] = select('#grid' + i);
  }
  frameRate(framerate);
}

function draw() {
  if (layers[layers.length - 1] == null) {
    return;
  }

  const halfX = windowWidth / 2;
  const halfY = windowHeight / 2;

  const yPercentage = mouseY / windowHeight;
  const xPercentage = mouseX / windowWidth;

  intervalSize = calcRelativeValue(minIntervalSize, maxIntervalSize, yPercentage);
  activeFor = calcRelativeValue(minActiveFor, maxActiveFor, xPercentage);

  for (let i = 0; i < numberOfLayers; i++) {
    const percentage = (numberOfLayers - i) / numberOfLayers;
    layers[i].style('left', (((halfX - mouseX) / halfX) * 32 * percentage) + 'px')
    layers[i].style('top', (((halfY - mouseY) / halfY) * 18 * percentage) + 'px')
  }


  frameCounter++;
  if (frameCounter >= framerate / intervalSize) {
    frameCounter = 0;
    intervalsPassed++;
    onSecondPassed()
  }
}

function calcRelativeValue(min, max, percent) {
  return min + (max - min) * percent;
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'z') {
    zoomActive = !zoomActive;
    zoom.style('transform', 'scale(1)');
  }
  if (modes.includes(e.key)) {
    mode = e.key;
    clearMap();
    if (mode === '3') {
      initSound();
    } else {
      if (audio) {
        audio.pause();
      }
    }
  }
});


function initSound() {
  audio = document.getElementById('audio');
  audio.src = soundfile;

  if (!context) {
    context = new AudioContext();
  }
  audio.currentTime = 0;
  audio.volume = volume;
  audio.play();

  if (!analyser) {
    analyser = context.createAnalyser();
    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  }

  if (!audioSource) {
    audioSource = context.createMediaElementSource(audio);
    audioSource.connect(analyser);
    analyser.connect(context.destination);
  }

  function analyze() {
    if (mode !== '3') {
      clearMap();
      return;
    }
    analyser.getByteFrequencyData(dataArray);
    drawSoundBars();
    drawMap();
    moveLayers();
    requestAnimationFrame(analyze);
  }

  analyze();
}

function clearMap() {
  map = new Array(numberOfLayers).fill(0).map(() => new Array(9).fill(0).map(() => new Array(16).fill(false)));
}


function onSecondPassed() {
  if (mode === '3') {
    return;
  }
  switch (mode) {
    case '1':
      forward();
      break;
    case '2':
      backward();
      break;
    case '3':
      drawSoundBars();
      break;
  }
  drawMap();
  moveLayers();
}

function drawSoundBars() {
  if (dataArray === null) {
    return;
  }
  if (zoomActive) {
    let scalefactor = Math.floor(dataArray.reduce((acc, wert) => acc + wert, 0) / dataArray.length);
    scalefactor = (scalefactor / 255) ** 3;
    zoom.style('transform', 'scale(' + (Math.min(1 + scalefactor, 1.05)) + ')');
  }
  for (let col = 0; col < 16; col++) {
    const activeSquares = Math.round((dataArray[Math.floor(col * 1.3)] / 230) * 9);
    if (activeSquares > 0) {
      for (let i = 0; i < 9; i++) {
        map[0][8 - i][col] = activeSquares > i + 1;
      }
    }
  }
}

function applyStyle(layer, row, column, cellValue) {
  const cell = selectCell(layer, row, column);
  if (cellValue) {
    cell.addClass('active');
    cell.html(charActive);
  } else {
    cell.removeClass('active');
    cell.html(charInactive);
  }
}

function selectCell(layer, row, column) {
  return select('#l' + layer + 'r' + row + 'c' + column);
}

function moveLayers() {
  if (mode === '2') {
    for (let layer = 0; layer < numberOfLayers - 1; layer++) {
      map[layer] = structuredClone(map[layer + 1]);
    }
  } else {
    for (let layer = numberOfLayers - 1; layer > 0; layer--) {
      map[layer] = structuredClone(map[layer - 1]);
    }
  }
}

function drawMap() {
  map.forEach((l, layer) => {
    l.forEach((r, row) => {
      r.forEach((cellValue, column) => {
        if (cellValue !== mapPrevious[layer][row][column]) {
          applyStyle(layer, row, column, cellValue);
        }
      });
    });
  });

  mapPrevious = structuredClone(map);
}

function createGrid(cols, rows) {
  for (let layer = 0; layer < numberOfLayers; layer++) {
    const grid = document.getElementById('grid' + layer);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const div = document.createElement('div');
        div.classList.add('square');
        div.classList.add('c' + col);
        div.classList.add('r' + row);
        div.classList.add('square' + layer);
        div.id = `l${layer}r${row}c${col}`;
        div.textContent = charInactive;
        grid.appendChild(div);
      }
    }
  }
}

function setCell(row, column, value, layer = 0) {
  map[layer][row][column] = value;
}

function backward() {
  const rndmRow = Math.floor(Math.random() * 9);
  const rndmCol = Math.floor(Math.random() * 16);
  setCell(rndmRow, rndmCol, true, numberOfLayers - 1);
  setTimeout(() => { setCell(rndmRow, rndmCol, false, numberOfLayers - 1) }, activeFor)
}

function forward() {
  const rndmRow = Math.floor(Math.random() * 9);
  const rndmCol = Math.floor(Math.random() * 16);
  setCell(rndmRow, rndmCol, true);
  setTimeout(() => { setCell(rndmRow, rndmCol, false) }, activeFor)
}
