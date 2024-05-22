// CONFIG
const numberOfLayers = 5;
const framerate = 60;
const minIntervalSize = 25;
const maxIntervalSize = 5; // 1: 1 Second, 10: 0.1 Seconds
const modes = ['s', '1', '2', '3', '4'];
const minActiveFor = 150;
const maxActiveFor = 1500;

let intervalSize = 25;
let activeFor = 250;
let mode = '';
let frameCounter = 0;
let intervalsPassed = 0;
let layer0, layer1, layer2, layer3, layer4 = null;
let map = new Array(numberOfLayers).fill(0).map(() => new Array(9).fill(0).map(() => new Array(16).fill(false))); // [layer, row, column]
let mapPrevious = structuredClone(map);

function setup() {
  noCanvas();
  createGrid(16, 9);

  layer0 = select('#grid0');
  layer1 = select('#grid1');
  layer2 = select('#grid2');
  layer3 = select('#grid3');
  layer4 = select('#grid4');
  frameRate(framerate);
}

function calcRelativeValue(min, max, percent) {
  return min + (max - min) * percent;
}

document.addEventListener('keydown', function (e) {
  if (modes.includes(e.key)) {
    mode = e.key;
    clearMap();
  }
});

function clearMap() {
  map =new Array(numberOfLayers).fill(0).map(() => new Array(9).fill(0).map(() => new Array(16).fill(false)));
}

function draw() {
  if (layer4 == null) {
    return;
  }

  const halfX = windowWidth / 2;
  const halfY = windowHeight / 2;

  const yPercentage = mouseY / windowHeight;
  const xPercentage = mouseX / windowWidth;

  intervalSize = calcRelativeValue(minIntervalSize, maxIntervalSize, yPercentage);
  activeFor = calcRelativeValue(minActiveFor, maxActiveFor, xPercentage);

  layer0.style('left', (((halfX - mouseX) / halfX) * 23) + 'px');
  layer0.style('top', (((halfY - mouseY) / halfY) * 13) + 'px');

  layer1.style('left', (((halfX - mouseX) / halfX) * 18) + 'px');
  layer1.style('top', (((halfY - mouseY) / halfY) * 10) + 'px');

  layer2.style('left', (((halfX - mouseX) / halfX) * 13) + 'px');
  layer2.style('top', (((halfY - mouseY) / halfY) * 7) + 'px');

  layer3.style('left', (((halfX - mouseX) / halfX) * 8) + 'px');
  layer3.style('top', (((halfY - mouseY) / halfY) * 4) + 'px');

  layer4.style('left', (((halfX - mouseX) / halfX) * 3) + 'px');
  layer4.style('top', (((halfY - mouseY) / halfY) * 1) + 'px');

  frameCounter++;
  if (frameCounter >= framerate / intervalSize) {
    frameCounter = 0;
    intervalsPassed++;
    onSecondPassed()
  }
}

function onSecondPassed() {
  switch (mode) {
    case '1':
      forward();
      break;
    case '2':
      backward();
      break;
  }
  moveLayers();
  drawMap();
}

function applyStyle(layer, row, column, cellValue) {
  const cell = selectCell(layer, row, column);
  if (cellValue) {
    cell.addClass('active');
  } else {
    cell.removeClass('active');
  }
}

function selectCell(layer, row, column) {
  return select('#l' + layer + 'r' + row + 'c' + column);
}

function moveLayers() {
  if (mode === '2') { // reverse
    console.log('asd');
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
        div.classList.add('square' + layer);
        div.id = `l${layer}r${row}c${col}`;
        div.textContent = `O`;
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
