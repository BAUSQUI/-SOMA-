let cols, rows;
let spacing = 60;
let points = [];
let broches = [];
let letras = ['S', 'O', 'M', 'A'];
let letraIndex = 0;
let initialRadius = 60;
let targetRadius = 200;
let liquidRadius = initialRadius;
let radiusLerpAmt = 0.1;
let minDistance = 80;
let fontSizeSlider;
let shouldExpand = false;
let resetButton;
let gridSize = 10; // Changed from 10 to 30
let mostrarGrilla = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  userStartAudio();

  frameRate(10);

  fontSizeSlider = createSlider(20, 80, 48, 1);
  fontSizeSlider.position(10, height + 20);
  fontSizeSlider.style('width', '580px');

  resetButton = createButton('Limpiar Cuerpo');
  resetButton.position(600, height + 15);
  resetButton.mousePressed(resetSketch);
  resetButton.style('background', 'white');
  resetButton.style('border', '1px solid rgba(0,0,0,0.2)');
  resetButton.style('border-radius', '14px');
  resetButton.style('padding', '1px 15px');
  resetButton.style('cursor', 'pointer');
  resetButton.style('font-family', 'Archivo');

  fontSizeSlider.style('background', 'transparent');
  fontSizeSlider.style('border', 'none');
  fontSizeSlider.style('height', '4px');
  fontSizeSlider.style('outline', 'none');
  fontSizeSlider.style('-webkit-appearance', 'none');

  let style = document.createElement('style');
  style.innerHTML = `
    input[type=range]::-webkit-slider-runnable-track {
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      border: 1px solid rgba(0,0,0,0.2);
      margin-top: -7px;
      transition: all 0.2s ease;
    }
    input[type=range]::-webkit-slider-thumb:hover {
      transform: scale(1.1);
    }
    input[type=range]::-moz-range-track {
      height: 4px;
      background: rgba(255,255,255,0.3);
      border-radius: 2px;
    }
    input[type=range]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      border: 1px solid rgba(0,0,0,0.2);
    }
  `;
  document.head.appendChild(style);

 
  textFont('Archivo');
  textStyle(BOLD);

  noiseDetail(3, 0.5);

  initializePoints();
}

function initializePoints() {
  points = [];
  let totalPoints = 100;
  for (let i = 0; i < totalPoints; i++) {
    let angle = map(i, 0, totalPoints, 0, TWO_PI);
    let r = liquidRadius + map(noise(cos(angle) * 2, sin(angle) * 2), 0, 1, -40, 40);
    let x = width / 2 + cos(angle) * r;
    let y = height / 2 + sin(angle) * r;
    points.push(createVector(x, y));
  }
}

function resetSketch() {
  broches = [];
  letraIndex = 0;
  liquidRadius = initialRadius;
  shouldExpand = false;
  initializePoints();
}

function snapToGrid(x, y) {
  let cellSize = min(width, height) / gridSize;
  let gridX = round((x - width / 2 + cellSize * gridSize / 2) / cellSize) * cellSize + width / 2 - cellSize * gridSize / 2;
  let gridY = round((y - height / 2 + cellSize * gridSize / 2) / cellSize) * cellSize + height / 2 - cellSize * gridSize / 2;
  return createVector(gridX, gridY);
}

function drawGridClipped(shapePoints) {
  let pg = createGraphics(width, height);
  let mask = createGraphics(width, height);

  // Dibujar la forma en la máscara
  mask.beginShape();
  for (let i = 0; i <= shapePoints.length; i++) {
    let p = shapePoints[i % shapePoints.length];
    if (i === 0) {
      mask.vertex(p.x, p.y);
    } else {
      mask.curveVertex(p.x, p.y);
    }
  }
  mask.endShape(CLOSE);

  // Dibujar la grilla
  pg.stroke(255);
  pg.strokeWeight(1);
  let cellSize = min(width, height) / gridSize;
  let startX = width / 2 - (gridSize * cellSize) / 2;
  let startY = height / 2 - (gridSize * cellSize) / 2;

  for (let i = 0; i <= gridSize; i++) {
    let x = startX + i * cellSize;
    pg.line(x, startY, x, startY + gridSize * cellSize);
  }

  for (let j = 0; j <= gridSize; j++) {
    let y = startY + j * cellSize;
    pg.line(startX, y, startX + gridSize * cellSize, y);
  }

  // Aplicar máscara
  pg.drawingContext.globalCompositeOperation = 'destination-in';
  pg.image(mask, 0, 0);

  image(pg, 0, 0);
}

function draw() {
  background(0);

  if (shouldExpand) {
    liquidRadius = lerp(liquidRadius, targetRadius, radiusLerpAmt);
  }

  let dynamicRadius = liquidRadius * (fontSizeSlider.value() / 48);
  let deformedPoints = [];

  for (let i = 0; i < points.length; i++) {
    let angle = map(i, 0, points.length, 0, TWO_PI);
    let baseR = liquidRadius + map(noise(cos(angle) * 1, sin(angle) * 1), 0, 1, -40, 40);
    let baseX = width / 2 + cos(angle) * baseR;
    let baseY = height / 2 + sin(angle) * baseR;
    let p = createVector(baseX, baseY);

    let deformedP = p.copy();
    for (let b of broches) {
      let d = dist(p.x, p.y, b.pos.x, b.pos.y);
      if (d < dynamicRadius * 0.8) {
        let force = p5.Vector.sub(b.pos, p);
        force.mult(1.5 * (fontSizeSlider.value() / 48) * (1 - d / (dynamicRadius * 0.8)));
        deformedP.add(force);
      }
    }
    deformedPoints.push(deformedP);
  }

  // Forma blanca
  fill(255);
  noStroke();
  beginShape();
  for (let i = 0; i <= deformedPoints.length; i++) {
    let idx = i % deformedPoints.length;
    let p = deformedPoints[idx];
    curveVertex(p.x, p.y);
  }
  endShape(CLOSE);

  if (mostrarGrilla) {
    drawGridClipped(deformedPoints);
  }

  for (let b of broches) {
    b.update();
    b.display(fontSizeSlider.value());
  }
}

function mousePressed() {
  for (let b of broches) {
    if (b.isMouseOver(fontSizeSlider.value())) {
      b.dragging = true;
      b.playSound();
      return;
    }
  }

  let dynamicRadius = liquidRadius * (fontSizeSlider.value() / 48);
  if (dist(mouseX, mouseY, width / 2, height / 2) < dynamicRadius * 0.8) {
    let canPlace = true;
    for (let b of broches) {
      if (dist(mouseX, mouseY, b.pos.x, b.pos.y) < minDistance * (fontSizeSlider.value() / 48)) {
        canPlace = false;
        break;
      }
    }

    if (canPlace) {
      if (broches.length === 0 && !shouldExpand) {
        shouldExpand = true;
      }
      let snappedPos = snapToGrid(mouseX, mouseY);
      let letra = letras[letraIndex];
      letraIndex = (letraIndex + 1) % letras.length;
      let nuevoBroche = new Broche(snappedPos.x, snappedPos.y, letra);
      broches.push(nuevoBroche);
      nuevoBroche.playSound();
    }
  }
}

function mouseReleased() {
  for (let b of broches) {
    if (b.dragging) {
      let snappedPos = snapToGrid(b.pos.x, b.pos.y);
      b.pos.set(snappedPos.x, snappedPos.y);
      b.target.set(snappedPos.x, snappedPos.y);
    }
    b.dragging = false;
    b.stopSound();
  }
}

function keyPressed() {
  if (key === 'g' || key === 'G') {
    mostrarGrilla = !mostrarGrilla;
  }
}

class Broche {
  constructor(x, y, letra) {
    this.pos = createVector(x, y);
    this.target = this.pos.copy();
    this.dragging = false;
    this.letra = letra;
    this.r = 30;
    this.sound = loadSound('assets/paper.wav');
    this.sound.setLoop(true);
  }

  playSound() {
    if (!this.sound.isPlaying()) {
      this.sound.play();
    }
  }

  stopSound() {
    if (this.sound.isPlaying()) {
      this.sound.stop();
    }
  }

  update() {
    if (this.dragging) {
      this.target.set(mouseX, mouseY);
    }
    this.pos.lerp(this.target, 0.15);

    let dynamicRadius = liquidRadius * (fontSizeSlider.value() / 48);
    let centerDist = dist(this.pos.x, this.pos.y, width / 2, height / 2);
    if (centerDist > dynamicRadius * 0.9) {
      let angle = atan2(this.pos.y - height / 2, this.pos.x - width / 2);
      this.target.x = width / 2 + cos(angle) * dynamicRadius * 0.9;
      this.target.y = height / 2 + sin(angle) * dynamicRadius * 0.9;
    }
  }

  display(fontSize) {
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(fontSize);
    text(this.letra, this.pos.x, this.pos.y);
    this.r = fontSize * 0.5;
  }

  isMouseOver(fontSize) {
    return dist(mouseX, mouseY, this.pos.x, this.pos.y) < fontSize * 0.6;
  }
}
