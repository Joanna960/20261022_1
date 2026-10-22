// 設定六題幼兒生活常識、題目語音與正確答案。
const questions = [
  { prompt: "小朋友洗手時，要怎麼做才乾淨呢？", emoji: "🧼", color: "#dff5f4", answer: "洗手後要用肥皂搓一搓" },
  { prompt: "想要牙齒亮晶晶，每天要記得做什麼呢？", emoji: "🪥", color: "#fff0e8", answer: "早晚都要刷牙" },
  { prompt: "吃什麼食物，會讓身體更健康有活力呢？", emoji: "🥦", color: "#e8f4df", answer: "多吃蔬菜身體棒" },
  { prompt: "過馬路時，要怎麼做才安全呢？", emoji: "🚸", color: "#fff4d8", answer: "過馬路要牽大人" },
  { prompt: "晚上做什麼事情，隔天才會精神飽滿呢？", emoji: "🛏️", color: "#e8efff", answer: "晚上早點睡覺" },
  { prompt: "丟垃圾以前，要記得做好什麼呢？", emoji: "♻️", color: "#e4f3e5", answer: "垃圾要做好分類" }
];

// 建立打散後的文字選項，並準備互動與動畫狀態。
let choices = [];
let placedAnswers = Array(6).fill(null);
let draggingChoice = null;
let dragOriginIndex = -1;
let dragOffsetX = 0;
let dragOffsetY = 0;
let submitted = false;
let score = 0;
let confetti = [];
let canvasWidth = 0;
let canvasHeight = 0;
let layout = {};

// 建立全螢幕畫布、文字選項與無外距的頁面設定。
function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.body);
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  textFont("Noto Sans TC, Microsoft JhengHei, sans-serif");
  textAlign(CENTER, CENTER);
  choices = questions.map((question, index) => ({
    id: index,
    text: question.answer,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    homeX: 0,
    homeY: 0
  }));
  shuffle(choices, true);
  document.documentElement.style.margin = "0";
  document.documentElement.style.overflow = "hidden";
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.background = "#f7f8f1";
  calculateLayout();
}

// 依視窗大小配置題目、答案籤與交卷按鈕的位置。
function calculateLayout() {
  canvasWidth = width;
  canvasHeight = height;
  const compact = width < 620;
  const margin = compact ? 14 : 34;
  const gap = compact ? 8 : 14;
  const columns = 3;
  const cardWidth = (width - margin * 2 - gap * (columns - 1)) / columns;
  const headerHeight = compact ? 100 : 126;
  const footerHeight = compact ? 184 : 216;
  const cardAreaTop = headerHeight;
  const cardAreaHeight = Math.max(226, height - headerHeight - footerHeight - 12);
  const cardGapY = compact ? 9 : 13;
  const cardHeight = (cardAreaHeight - cardGapY) / 2;
  const cardTop = cardAreaTop;
  const choiceGap = compact ? 8 : 12;
  const choiceWidth = (width - margin * 2 - choiceGap * 2) / 3;
  const choiceHeight = compact ? 46 : 58;
  const choiceTop = height - footerHeight + 10;

  layout = {
    compact,
    margin,
    gap,
    columns,
    cardWidth,
    cardHeight,
    cardTop,
    cardGapY,
    choiceWidth,
    choiceHeight,
    choiceTop,
    button: {
      x: width / 2 - (compact ? 92 : 108),
      y: height - (compact ? 54 : 64),
      w: compact ? 184 : 216,
      h: compact ? 42 : 48
    }
  };

  // 重算尚未作答文字籤的位置，避免視窗改變後跑出畫布。
  choices.forEach((choice, index) => {
    if (draggingChoice === choice || placedAnswers.includes(choice.id)) return;
    const column = index % 3;
    const row = Math.floor(index / 3);
    choice.w = choiceWidth;
    choice.h = choiceHeight;
    choice.homeX = margin + column * (choiceWidth + choiceGap);
    choice.homeY = choiceTop + row * (choiceHeight + choiceGap);
    choice.x = choice.homeX;
    choice.y = choice.homeY;
  });
}

// 繪製柔和底色、標題、六個配對區與可拖曳文字選項。
function draw() {
  background("#f7f8f1");
  drawHeader();
  drawQuestionCards();
  drawChoices();
  drawSubmitButton();
  drawConfetti();
  if (submitted) drawResult();
}

// 繪製測驗標題與簡短操作提示。
function drawHeader() {
  noStroke();
  fill("#173f35");
  textStyle(BOLD);
  textSize(layout.compact ? 23 : 30);
  text("生活小達人", width / 2, layout.compact ? 30 : 40);
  fill("#68766c");
  textStyle(NORMAL);
  textSize(layout.compact ? 12 : 15);
  text("點圖聽題目，再把下方答案拖到圖卡", width / 2, layout.compact ? 61 : 76);
  fill("#e7eee3");
  rect(layout.margin, layout.compact ? 82 : 102, width - layout.margin * 2, 1, 1);
}

// 繪製上方六張固定圖卡、GIF 圖像與文字投放位置。
function drawQuestionCards() {
  questions.forEach((question, index) => {
    const card = getCardRect(index);
    const assignedId = placedAnswers[index];
    const isCorrect = submitted && assignedId === index;
    const isWrong = submitted && assignedId !== null && assignedId !== index;

    noStroke();
    fill("#ffffff");
    rect(card.x, card.y, card.w, card.h, 13);
    fill(isCorrect ? "#e2f4e7" : isWrong ? "#fff0e9" : "#f1f5ee");
    rect(card.x + 7, card.y + 7, card.w - 14, card.h - 14, 10);

    drawQuestionIllustration(index, card.x + card.w / 2, card.y + card.h * 0.37, card.iconSize);

    noStroke();
    fill("#315a48");
    textStyle(BOLD);
    textSize(layout.compact ? 10 : 13);
    text(`第 ${index + 1} 題`, card.x + card.w / 2, card.slotY - 8);
    drawAnswerSlot(card, assignedId);
  });
}

// 以 p5.js 圖形繪製會輕輕晃動的本地插畫，不需要連線下載圖片。
function drawQuestionIllustration(index, centerX, centerY, size) {
  const bob = sin(frameCount * 0.06 + index) * 2;
  push();
  translate(centerX, centerY + bob);
  noStroke();
  fill(questions[index].color);
  circle(0, 0, size * 1.38);
  fill("#ffffff");
  circle(-size * 0.38, -size * 0.36, size * 0.16);
  textAlign(CENTER, CENTER);
  textSize(size * 0.92);
  text(questions[index].emoji, 0, 1);
  pop();
}

// 計算每張配對圖卡與文字投放區的位置。
function getCardRect(index) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  const x = layout.margin + column * (layout.cardWidth + layout.gap);
  const y = layout.cardTop + row * (layout.cardHeight + layout.cardGapY);
  const slotHeight = layout.compact ? 34 : 40;
  return {
    x,
    y,
    w: layout.cardWidth,
    h: layout.cardHeight,
    iconSize: Math.min(layout.compact ? 58 : 88, layout.cardHeight * 0.44),
    slotY: y + layout.cardHeight - slotHeight - 8,
    slotHeight
  };
}

// 繪製空白投放框或已放入的文字答案。
function drawAnswerSlot(card, assignedId) {
  const slotX = card.x + 8;
  const slotWidth = card.w - 16;
  const highlighted = draggingChoice && isPointerNearSlot(card);
  stroke(highlighted ? "#ef8e52" : assignedId === null ? "#91ad98" : "#5a8f6d");
  strokeWeight(highlighted ? 3 : 1.5);
  if (assignedId === null && !highlighted) drawingContext.setLineDash([5, 4]);
  else drawingContext.setLineDash([]);
  fill(highlighted ? "#fff3e9" : assignedId === null ? "#ffffff" : "#e5f3e8");
  rect(slotX, card.slotY, slotWidth, card.slotHeight, 8);
  drawingContext.setLineDash([]);
  noStroke();
  fill(assignedId === null ? "#829087" : "#234d36");
  textStyle(assignedId === null ? NORMAL : BOLD);
  const answer = assignedId === null ? "把答案放這裡" : questions[assignedId].answer;
  textSize(Math.min(layout.compact ? 10 : 13, slotWidth / Math.max(7, answer.length) * 1.8));
  text(answer, slotX + 5, card.slotY + 2, slotWidth - 10, card.slotHeight - 4);
}

// 判斷游標是否靠近投放框，讓正確位置即時醒目提示。
function isPointerNearSlot(card) {
  const slotX = card.x + 8;
  const slotWidth = card.w - 16;
  const padding = 20;
  return mouseX >= slotX - padding && mouseX <= slotX + slotWidth + padding &&
    mouseY >= card.slotY - padding && mouseY <= card.slotY + card.slotHeight + padding;
}

// 繪製下方六張可拖曳的文字答案籤。
function drawChoices() {
  choices.forEach((choice) => {
    if (placedAnswers.includes(choice.id) || choice === draggingChoice) return;
    drawChoice(choice, false);
  });
  if (draggingChoice) drawChoice(draggingChoice, true);
}

// 繪製單張答案籤，拖曳中使用較醒目的狀態。
function drawChoice(choice, isDragging) {
  noStroke();
  fill(isDragging ? "#b5dbbf" : "#ffffff");
  rect(choice.x, choice.y, choice.w, choice.h, 9);
  stroke(isDragging ? "#528464" : "#d8e2d8");
  strokeWeight(1);
  noFill();
  rect(choice.x, choice.y, choice.w, choice.h, 9);
  noStroke();
  fill("#294b3c");
  textStyle(BOLD);
  textSize(layout.compact ? 10 : 13);
  text(choice.text, choice.x + 5, choice.y + 3, choice.w - 10, choice.h - 6);
}

// 顯示答滿六題後才能使用的交卷按鈕。
function drawSubmitButton() {
  if (submitted || placedAnswers.some((answer) => answer === null)) return;
  const button = layout.button;
  noStroke();
  fill("#ef8e52");
  rect(button.x, button.y, button.w, button.h, 12);
  fill("#ffffff");
  textStyle(BOLD);
  textSize(layout.compact ? 14 : 16);
  text("交卷看成績", button.x + button.w / 2, button.y + button.h / 2);
}

// 計算卡片格線，讓滑鼠與觸控都能開始拖曳答案。
function mousePressed() {
  if (submitted) return false;
  // 點擊圖卡插畫時，親切唸出該題提示。
  for (let index = 0; index < questions.length; index += 1) {
    const card = getCardRect(index);
    const imageArea = { x: card.x, y: card.y, w: card.w, h: card.slotY - card.y - 12 };
    if (pointInside(mouseX, mouseY, imageArea)) {
      speakQuestion(index);
      return false;
    }
  }
  // 點擊已填入的答案時，取出答案以便重新移動或交換。
  for (let index = 0; index < placedAnswers.length; index += 1) {
    const assignedId = placedAnswers[index];
    if (assignedId === null) continue;
    const card = getCardRect(index);
    const slot = { x: card.x + 8, y: card.slotY, w: card.w - 16, h: card.slotHeight };
    if (pointInside(mouseX, mouseY, slot)) {
      draggingChoice = choices.find((choice) => choice.id === assignedId);
      dragOriginIndex = index;
      placedAnswers[index] = null;
      dragOffsetX = draggingChoice.w / 2;
      dragOffsetY = draggingChoice.h / 2;
      draggingChoice.x = mouseX - dragOffsetX;
      draggingChoice.y = mouseY - dragOffsetY;
      return false;
    }
  }
  for (let index = choices.length - 1; index >= 0; index -= 1) {
    const choice = choices[index];
    if (placedAnswers.includes(choice.id)) continue;
    if (pointInside(mouseX, mouseY, choice)) {
      draggingChoice = choice;
      dragOffsetX = mouseX - choice.x;
      dragOffsetY = mouseY - choice.y;
      return false;
    }
  }
  return false;
}

// 使用瀏覽器中文語音，以較慢速度和活潑音高唸出題目。
function speakQuestion(index) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(questions[index].prompt);
  utterance.lang = "zh-TW";
  utterance.rate = 0.82;
  utterance.pitch = 1.15;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith("zh-tw")) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("zh")) || null;
  window.speechSynthesis.speak(utterance);
}

// 拖曳時跟隨指標移動，並限制答案籤留在畫布範圍內。
function mouseDragged() {
  if (!draggingChoice || submitted) return false;
  draggingChoice.x = constrain(mouseX - dragOffsetX, 0, width - draggingChoice.w);
  draggingChoice.y = constrain(mouseY - dragOffsetY, 0, height - draggingChoice.h);
  return false;
}

// 放開答案時放入最近的空格，若沒有空格則回到原處。
function mouseReleased() {
  if (submitted) return false;
  // 所有答案填妥後可直接點擊交卷，不需要先拖曳答案。
  if (!draggingChoice && placedAnswers.every((answer) => answer !== null) && pointInside(mouseX, mouseY, layout.button)) {
    submitQuiz();
    return false;
  }
  if (!draggingChoice) return false;
  const target = findDropTarget();
  if (target !== -1) {
    const displacedId = placedAnswers[target];
    placedAnswers[target] = draggingChoice.id;
    if (dragOriginIndex !== -1 && dragOriginIndex !== target) {
      placedAnswers[dragOriginIndex] = displacedId;
    }
  } else if (dragOriginIndex !== -1) {
    placedAnswers[dragOriginIndex] = draggingChoice.id;
  }
  draggingChoice.x = draggingChoice.homeX;
  draggingChoice.y = draggingChoice.homeY;
  draggingChoice = null;
  dragOriginIndex = -1;
  return false;
}

// 從游標位置找出最近且仍空白的圖卡投放區。
function findDropTarget() {
  let nearestIndex = -1;
  let nearestDistance = Infinity;
  questions.forEach((question, index) => {
    const card = getCardRect(index);
    const centerX = card.x + card.w / 2;
    const centerY = card.slotY + card.slotHeight / 2;
    const distance = dist(mouseX, mouseY, centerX, centerY);
    if (isPointerNearSlot(card) && distance < nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  });
  return nearestIndex;
}

// 交卷時計算答對題數，並在高於百分之八十時準備彩帶。
function submitQuiz() {
  score = placedAnswers.filter((answer, index) => answer === index).length;
  submitted = true;
  if (score / questions.length > 0.8) {
    for (let index = 0; index < 150; index += 1) {
      confetti.push({
        x: random(width),
        y: random(-height, 0),
        speed: random(2, 6),
        size: random(5, 10),
        angle: random(TWO_PI),
        spin: random(-0.08, 0.08),
        color: random(["#ef8e52", "#e7c94d", "#55a77a", "#62a6c8", "#e87777"])
      });
    }
  }
}

// 顯示作答成績與鼓勵訊息。
function drawResult() {
  noStroke();
  fill(0, 0, 0, 90);
  rect(0, 0, width, height);
  const panelWidth = Math.min(width - 36, 340);
  const panelHeight = 190;
  const panelX = (width - panelWidth) / 2;
  const panelY = (height - panelHeight) / 2;
  fill("#ffffff");
  rect(panelX, panelY, panelWidth, panelHeight, 18);
  fill("#173f35");
  textStyle(BOLD);
  textSize(22);
  text("交卷完成！", width / 2, panelY + 40);
  fill(score / questions.length > 0.8 ? "#ef8e52" : "#4e8061");
  textSize(38);
  text(`${Math.round((score / questions.length) * 100)} 分`, width / 2, panelY + 94);
  fill("#65746a");
  textStyle(NORMAL);
  textSize(14);
  text(`答對 ${score} 題，共 ${questions.length} 題`, width / 2, panelY + 135);
  text(score / questions.length > 0.8 ? "太棒了，你是生活小達人！" : "再試一次，一定會更棒！", width / 2, panelY + 162);
}

// 更新並繪製得分達標時的彩帶效果。
function drawConfetti() {
  if (confetti.length === 0) return;
  noStroke();
  confetti.forEach((piece) => {
    fill(piece.color);
    push();
    translate(piece.x, piece.y);
    rotate(piece.angle);
    rect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2, 1);
    pop();
    piece.y += piece.speed;
    piece.x += sin(piece.angle) * 1.4;
    piece.angle += piece.spin;
    if (piece.y > height + 12) {
      piece.y = random(-80, -10);
      piece.x = random(width);
    }
  });
}

// 判斷游標是否落在指定矩形範圍內。
function pointInside(x, y, rectArea) {
  return x >= rectArea.x && x <= rectArea.x + rectArea.w &&
    y >= rectArea.y && y <= rectArea.y + rectArea.h;
}

// 視窗尺寸改變時重新調整全螢幕畫布與排版。
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateLayout();
}
