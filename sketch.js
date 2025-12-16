let spriteSheet;
let animation = [];
const totalFrames = 8; // 改為 8 張走路圖片
let currentFrame = 0;
let frameWidth;
const totalJumpFrames = 5; // jump 資料夾有 5 張圖片
let jumpAnimation = [];
let currentJumpFrame = 0;
let jumpStartFrame = 0;

// ----- 新角色變數 -----
let spriteSheet2;
let animation2 = [];
const totalFrames2 = 8;
let currentFrame2 = 0;
let frameWidth2;
let character2X;
let character2Y;
// ----- 新角色3變數 -----
let spriteSheet3;
let animation3 = [];
const totalFrames3 = 6;
let currentFrame3 = 0;
let frameWidth3;
let character3X;
let character3Y;
// CSV 題庫與對話
let questionsTable;
let questions = [];
let questionsTable3; // 角色3的題庫表格
let questions3 = []; // 角色3的題目陣列
let currentNpc = 0;  // 目前互動的 NPC 編號 (0:無, 2:角色2, 3:角色3)
let character2Dialogue = '';
let showDialogue = false;
let dialogueTimer = 0; // 顯示計時器（以 frame 為單位）
// 目前對話框位置（用於避免重疊）
let dialogBox = { x: 0, y: 0, w: 0, h: 0 };
// 玩家輸入與獎勵系統
let playerInput; // p5 input element
let score = 0;
let baseMoveSpeed = 8;
let rewardTimer = 0; // 獎勵持續計時
let currentQuestionIndex = -1; // 當前題目索引
let retryButton;
let nextButton;
// happy 動畫
const totalHappyFrames = 12;
let happyFrames = [];
let happyAnimating = false;
let happyFrameIndex = 0;
let happyFrameDelay = 4; // 每幀持續的 draw 次數
let happyFrameCounter = 0;
let bgImg;
let bgX = 0;
let song; // 音樂變數

// ----- 遊戲變數 -----
let gameState = 'start'; // 遊戲狀態: 'start' 或 'playing'

// ----- 角色屬性 -----
let characterX;
let characterY;
let groundY; // 地面高度
let moveSpeed = 8; // 增加移動速度
let facingDirection = 1; // 1: 向右, -1: 向左

// ----- 跳躍物理屬性 -----
let isJumping = false;
let velocityY = 3.5;
const jumpPower = -25; // 讓跳躍更有力
const gravity = 3.5;   // 讓角色更快落地

function preload() {
  // 載入角色1 的 8 張走路圖片 (1/walk/0.png ... 1/walk/7.png)
  for (let i = 0; i < totalFrames; i++) {
    animation[i] = loadImage(`1/walk/${i}.png`);
  }

  // 載入跳躍動畫 1/jump/1.png ... 1/jump/5.png
  for (let j = 0; j < totalJumpFrames; j++) {
    // 跳躍圖片命名為 1.png..5.png
    jumpAnimation[j] = loadImage(`1/jump/${j + 1}.png`);
  }

  // 新角色使用原本的精靈表
  spriteSheet2 = loadImage('2/stop/stop_all.png');
  spriteSheet3 = loadImage('3/walk_all.png'); // 載入角色3的圖片精靈
  bgImg = loadImage('森林.png');
  // 載入題庫 CSV（必須放在專案根目錄）
  questionsTable = loadTable('questions.csv', 'csv', 'header');
  questionsTable3 = loadTable('name_questions.csv', 'csv', 'header'); // 載入角色3的題庫
  // 載入 happy 動畫的個別幀（1/happy/0.png ... 1/happy/11.png）
  for (let h = 0; h < totalHappyFrames; h++) {
    happyFrames[h] = loadImage(`1/happy/${h}.png`);
  }
  // 載入音樂 (來自 sketch(2).js)
  song = loadSound('music.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(bgImg);

  // 由 preload 已經載入每張走路圖片，使用第一張取得寬高
  frameWidth = animation[0].width; // 恢復原始寬度，避免變寬

  // 裁切新角色的圖片精靈 (維持原本做法)
  frameWidth2 = spriteSheet2.width / totalFrames2;
  for (let i = 0; i < totalFrames2; i++) {
    let frame = spriteSheet2.get(i * frameWidth2, 0, frameWidth2, spriteSheet2.height);
    animation2.push(frame);
  }

  // 裁切角色3的圖片精靈 (355*87, 6張)
  frameWidth3 = spriteSheet3.width / totalFrames3;
  for (let i = 0; i < totalFrames3; i++) {
    let frame = spriteSheet3.get(i * frameWidth3, 0, frameWidth3, spriteSheet3.height);
    animation3.push(frame);
  }

  // 解析 CSV 表格為 questions 陣列
  if (questionsTable && questionsTable.getRowCount() > 0) {
    for (let r = 0; r < questionsTable.getRowCount(); r++) {
      const row = questionsTable.getRow(r);
      questions.push({
        question: row.getString('question'),
        answer: row.getString('answer'),
        correctFeedback: row.getString('correctFeedback'),
        wrongFeedback: row.getString('wrongFeedback'),
        hint: row.getString('hint')
      });
    }
  }

  // 解析角色3的 CSV 表格 (中文欄位: 題目,答案,答對回饋,答錯回饋,提示)
  if (questionsTable3 && questionsTable3.getRowCount() > 0) {
    for (let r = 0; r < questionsTable3.getRowCount(); r++) {
      const row = questionsTable3.getRow(r);
      questions3.push({
        question: row.getString('題目'),
        answer: row.getString('答案'),
        correctFeedback: row.getString('答對回饋'),
        wrongFeedback: row.getString('答錯回饋'),
        hint: row.getString('提示')
      });
    }
  }

  // 設定角色初始位置
  characterX = width / 2 - frameWidth / 2;
  // 使用走路圖片高度來決定地面高度
  groundY = height - animation[0].height - 170; // 將地面高度往上移
  characterY = groundY;

  // 設定新角色初始位置
  character2X = characterX - frameWidth2 - 50;
  character2Y = groundY; // 統一高度位置，直接對齊地面

  // 設定角色3初始位置 (背景左手邊)
  character3X = characterX - 1500; // 設定在主角左方更遠處 (讓玩家需要走一段路)
  character3Y = groundY; // 統一高度位置，直接對齊地面

  // 提高動畫播放速度以配合移動
  frameRate(15);

  // 初始時不播放動畫
  noLoop();

  // 設定基礎速度與建立玩家輸入欄（隱藏，碰到題目時顯示）
  baseMoveSpeed = moveSpeed;
  playerInput = createInput('');
  playerInput.attribute('placeholder', '輸入答案並按 Enter');
  playerInput.size(140);
  playerInput.hide();
  // 使用原生事件監聽 Enter
  playerInput.elt.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  });

  // 建立答題控制按鈕，預設隱藏
  retryButton = createButton('再作答一次');
  retryButton.hide();
  retryButton.mousePressed(function () {
    retryQuestion();
  });

  nextButton = createButton('下一題');
  nextButton.hide();
  nextButton.mousePressed(function () {
    nextQuestion();
  });
}

function draw() {
  // 繪製背景 (三張圖串接：左、中、右)
  image(bgImg, bgX, 0, width, height);
  image(bgImg, bgX - width, 0, width, height);
  image(bgImg, bgX + width, 0, width, height);

  // 背景循環邏輯：當背景移動超過寬度時重置，造成無限捲動效果
  if (bgX <= -width) bgX += width;
  if (bgX >= width) bgX -= width;

  if (gameState === 'playing') {
    let isMoving = false;

    // 判斷是否按下 Shift 鍵加速 (跑步模式)
    let currentSpeed = moveSpeed;
    if (keyIsDown(SHIFT)) {
      currentSpeed = baseMoveSpeed * 2;
    }

    // ----- 鍵盤控制 -----
    if (keyIsDown(RIGHT_ARROW)) {
      bgX -= currentSpeed; // 背景往左移
      character2X -= currentSpeed; // 角色2 也要跟著背景移動
      character3X -= currentSpeed; // 角色3 也要跟著背景移動
      facingDirection = 1;
      isMoving = true;
    }
    if (keyIsDown(LEFT_ARROW)) {
      bgX += currentSpeed; // 背景往右移
      character2X += currentSpeed; // 角色2 也要跟著背景移動
      character3X += currentSpeed; // 角色3 也要跟著背景移動
      facingDirection = -1;
      isMoving = true;
    }
    if (keyIsDown(UP_ARROW) && !isJumping) {
      isJumping = true;
      velocityY = jumpPower;
      jumpStartFrame = frameCount; // 記錄跳躍開始的幀數，以便跳躍動畫播放
    }

    // ----- 跳躍邏輯 -----
    if (isJumping) {
      characterY += velocityY;
      velocityY += gravity;

      if (characterY >= groundY) {
        characterY = groundY;
        isJumping = false;
        velocityY = 0;
      }
    }
    // ----- 碰撞檢測 (角色1 與 角色2) -----
    // 使用簡單 AABB 碰撞
    let w1 = frameWidth;
    let h1 = animation[0].height;
    let w2 = frameWidth; // 改為統一寬度 (與主角相同)
    let h2 = animation[0].height; // 改為統一高度 (與主角相同)
    let left1 = characterX;
    let right1 = characterX + w1;
    let top1 = characterY;
    let bottom1 = characterY + h1;
    let left2 = character2X;
    let right2 = character2X + w2;
    let top2 = character2Y;
    let bottom2 = character2Y + h2;

    // 角色3 的碰撞框
    let left3 = character3X;
    let right3 = character3X + w2;
    let top3 = character3Y;
    let bottom3 = character3Y + h2;

    const isColliding2 = (right1 > left2 && left1 < right2 && bottom1 > top2 && top1 < bottom2);
    const isColliding3 = (right1 > left3 && left1 < right3 && bottom1 > top3 && top1 < bottom3);

    // 判斷與哪個 NPC 碰撞
    if (isColliding2 || isColliding3) {
      if (!showDialogue) {
        // 根據碰撞對象選擇題庫
        if (isColliding2) {
          currentNpc = 2;
          if (questions.length > 0) {
            const idx = floor(random(0, questions.length));
            currentQuestionIndex = idx;
            character2Dialogue = questions[idx].question;
          } else {
            character2Dialogue = '題庫不存在或無題目';
          }
        } else if (isColliding3) {
          currentNpc = 3;
          if (questions3.length > 0) {
            const idx = floor(random(0, questions3.length));
            currentQuestionIndex = idx;
            character2Dialogue = questions3[idx].question;
          } else {
            character2Dialogue = '你好！(無題目)';
          }
        }

        showDialogue = true;
        dialogueTimer = 300; // 顯示 300 幀（備援，但若離開會立即隱藏）
        
        // 顯示玩家輸入欄，並聚焦
        if (playerInput) {
          playerInput.show();
          playerInput.value('');
          playerInput.elt.focus();
        }
        // 隱藏按鈕（如果之前有顯示）
        if (retryButton) retryButton.hide();
        if (nextButton) nextButton.hide();
      }
    } else {
      // 未碰到時立即隱藏題目與輸入欄與按鈕
      showDialogue = false;
      currentNpc = 0;
      character2Dialogue = '';
      if (playerInput) playerInput.hide();
      if (retryButton) retryButton.hide();
      if (nextButton) nextButton.hide();
      currentQuestionIndex = -1;
    }

    // 如果文字正在顯示，遞減計時器（僅在仍碰撞或為回饋時有作用）
    if (showDialogue) {
      dialogueTimer--;
      if (dialogueTimer <= 0) {
        showDialogue = false;
        character2Dialogue = '';
        if (playerInput) playerInput.hide();
        if (retryButton) retryButton.hide();
        if (nextButton) nextButton.hide();
      }
    }

    // 處理獎勵計時（例如暫時移速加成）
    if (rewardTimer > 0) {
      rewardTimer--;
      if (rewardTimer <= 0) {
        moveSpeed = baseMoveSpeed; // 回復原速
      }
    }

    // ----- 動畫更新 -----
      if (isJumping) {
        // 跳躍時播放 jumpAnimation 的幀序列
        currentJumpFrame = floor((frameCount - jumpStartFrame) / 4) % totalJumpFrames;
      } else if (isMoving) {
        // 地面上移動時播放走路動畫 (使用所有走路幀)
        currentFrame = floor(frameCount / 4) % totalFrames;
      } else {
        // 靜止時顯示第一張作為站立姿勢（可改為其它索引）
        currentFrame = 0;
      }

      // happy 動畫更新（若正在播放）
      if (happyAnimating) {
        happyFrameCounter++;
        if (happyFrameCounter % happyFrameDelay === 0) {
          happyFrameIndex++;
          if (happyFrameIndex >= totalHappyFrames) {
            // 播完後恢復原狀
            happyAnimating = false;
            happyFrameIndex = 0;
            happyFrameCounter = 0;
          }
        }
      }

    // ----- 新角色動畫更新 -----
    // 讓新角色的走路動畫循環播放
    // floor(frameCount / 4) % totalFrames2 的速度會和原角色走路速度一樣
    currentFrame2 = floor(frameCount / 4) % totalFrames2;
    // 角色3 動畫更新
    currentFrame3 = floor(frameCount / 4) % totalFrames3;

  }

  // ----- 繪製角色 -----
  // ----- 繪製角色（主角） -----
  // 根據當前狀態選擇要繪製的圖片（happy 動畫優先）
  if (happyAnimating) {
    const img = happyFrames[happyFrameIndex];
    push();
    translate(characterX + frameWidth / 2, 0);
    scale(facingDirection, 1);
    image(img, -img.width / 2, characterY + animation[0].height - img.height);
    pop();
  } else {
    // 根據跳躍/走路選圖
    const img = isJumping ? jumpAnimation[currentJumpFrame] : animation[currentFrame];
    push();
    translate(characterX + frameWidth / 2, 0);
    scale(facingDirection, 1);
    image(img, -img.width / 2, characterY + animation[0].height - img.height);
    pop();
  }

  // ----- 繪製新角色 -----
  // 將其放置在原角色的左邊，並對齊底部
  image(animation2[currentFrame2], character2X, character2Y, frameWidth, animation[0].height); // 強制設定大小與主角相同

  // ----- 繪製角色3 -----
  image(animation3[currentFrame3], character3X, character3Y, frameWidth, animation[0].height); // 強制設定大小與主角相同

  // 顯示對話文字（若有）- 顯示在當前互動的 NPC 頭上
  if (showDialogue && character2Dialogue) {
    push();
    // 文本樣式（縮小字體）
    textAlign(LEFT);
    const chatTextSize = 16; // 縮小文字
    textSize(chatTextSize);
    fill(255);
    noStroke();

    // 計算自動換行並建立行陣列（根據最大寬度限制）
    const padding = 8;
    const maxWidthLimit = 360; // 對話框最大寬度
    const raw = character2Dialogue;
    const words = raw.split(/\s+/);
    let lines = [];
    let cur = '';
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const test = cur === '' ? w : cur + ' ' + w;
      const tw = textWidth(test);
      if (tw > maxWidthLimit - padding * 2 && cur !== '') {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur !== '') lines.push(cur);

    // 也要處理顯式換行符號
    if (character2Dialogue.indexOf('\n') >= 0) {
      // 保留原有的換行，優先使用手動換行
      lines = [];
      const chunks = character2Dialogue.split('\n');
      for (let c of chunks) {
        // 進一步按寬度拆行
        const parts = c.split(/\s+/);
        let l = '';
        for (let p of parts) {
          const t = l === '' ? p : l + ' ' + p;
          if (textWidth(t) > maxWidthLimit - padding * 2 && l !== '') {
            lines.push(l);
            l = p;
          } else {
            l = t;
          }
        }
        if (l !== '') lines.push(l);
      }
    }

    // 計算框寬高
    let boxW = 0;
    for (let ln of lines) {
      boxW = max(boxW, textWidth(ln));
    }
    boxW = min(boxW, maxWidthLimit - padding * 2);
    const lineHeight = chatTextSize * 1.2;
    const boxH = lines.length * lineHeight + padding * 2;

  // 對話框位置（根據 currentNpc 決定顯示在誰的上方）
  const tx = (currentNpc === 3) ? character3X : character2X;
  const ty = character2Y - 60 - boxH;

  // 背景矩形（深色）
  fill('#222');
  rect(tx - padding, ty - padding, boxW + padding * 2, boxH + padding * 2, 8);

  // 記錄對話框矩形 (用於避免與玩家頭上的輸入框重疊)
  dialogBox.x = tx - padding;
  dialogBox.y = ty - padding;
  dialogBox.w = boxW + padding * 2;
  dialogBox.h = boxH + padding * 2;

    // 文字顯示，逐行繪製
    fill(255);
    for (let i = 0; i < lines.length; i++) {
      text(lines[i], tx, ty + padding + (i + 1) * lineHeight - lineHeight / 4);
    }
    pop();
  }

  // 顯示玩家頭上的輸入欄（當有題目時）
  if (showDialogue && playerInput) {
    // 將 input 放在玩家頭上方
    const inputW = 140;
    const px = floor(characterX + frameWidth / 2 - inputW / 2);
    let py = floor(characterY - 70);
    // 檢查是否與角色2 的對話框重疊；若重疊，將輸入框移到對話框之上
    try {
      const inputH = (playerInput.elt && playerInput.elt.offsetHeight) ? playerInput.elt.offsetHeight : 24;
      const inputRect = { x: px, y: py, w: inputW, h: inputH };
      const db = dialogBox;
      const overlap = !(inputRect.x + inputRect.w < db.x || inputRect.x > db.x + db.w || inputRect.y + inputRect.h < db.y || inputRect.y > db.y + db.h);
      if (overlap) {
        // 把輸入框放在對話框的上方（比對話框更高一些）
        py = Math.floor(db.y - inputH - 8);
      }
    } catch (e) {
      // 如果讀取高度失敗就使用預設 py
    }
    playerInput.position(px, py);
    playerInput.show();
  }

  // 定位並顯示按鈕（如果有） -- 放在角色2 文字框的上方
  if (showDialogue) {
    // 重新計算對話框的寬度（與上方對話框顯示邏輯一致）以便置中按鈕
    const padding = 8;
    const maxWidthLimit = 360;
    const raw = character2Dialogue || '';
    const words = raw.split(/\s+/);
    let linesCalc = [];
    let curCalc = '';
    textSize(16);
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const test = curCalc === '' ? w : curCalc + ' ' + w;
      const tw = textWidth(test);
      if (tw > maxWidthLimit - padding * 2 && curCalc !== '') {
        linesCalc.push(curCalc);
        curCalc = w;
      } else {
        curCalc = test;
      }
    }
    if (curCalc !== '') linesCalc.push(curCalc);
    if (raw.indexOf('\n') >= 0) {
      linesCalc = [];
      const chunks = raw.split('\n');
      for (let c of chunks) {
        const parts = c.split(/\s+/);
        let l = '';
        for (let p of parts) {
          const t = l === '' ? p : l + ' ' + p;
          if (textWidth(t) > maxWidthLimit - padding * 2 && l !== '') {
            linesCalc.push(l);
            l = p;
          } else {
            l = t;
          }
        }
        if (l !== '') linesCalc.push(l);
      }
    }

    let boxW = 0;
    for (let ln of linesCalc) boxW = max(boxW, textWidth(ln));
    boxW = min(boxW, maxWidthLimit - padding * 2);
    const btnW = 120;
    const btnH = 28;
    const tx = (currentNpc === 3) ? character3X : character2X;
    // 計算對話框頂端 y（與對話框繪製邏輯一致）
    const lineHeight = 16 * 1.2;
    const boxH = linesCalc.length * lineHeight + padding * 2;
    const ty = character2Y - 60 - boxH;
    const bx = tx + (boxW - btnW) / 2;
    const by = ty - btnH - 8;

    if (retryButton && retryButton.style('display') !== 'none') {
      retryButton.position(floor(bx), floor(by));
      retryButton.show();
    }
    if (nextButton && nextButton.style('display') !== 'none') {
      nextButton.position(floor(bx), floor(by));
      nextButton.show();
    }
  }

  // 顯示分數與簡單 UI
  push();
  fill(0);
  noStroke();
  textSize(18);
  textAlign(LEFT);
  text(`Score: ${score}`, 16, 28);
  pop();

  // ----- 開始畫面提示 -----
  if (gameState === 'start') {
    fill(0);
    textAlign(CENTER);
    textSize(24);
    text('Click to Start', width / 2, height / 2 + 150);
  }
}

// ----- 事件處理 -----

// 檢查玩家輸入答案
function checkAnswer() {
  if (currentQuestionIndex < 0) return;
  
  // 根據 currentNpc 決定使用哪個題庫
  let currentQ;
  if (currentNpc === 2) {
    currentQ = questions[currentQuestionIndex];
  } else if (currentNpc === 3) {
    currentQ = questions3[currentQuestionIndex];
  }
  
  if (!currentQ) return;

  const user = playerInput.value().trim();
  const correct = currentQ.answer ? currentQ.answer.trim() : '';
  
  if (user === '') return; // 空輸入不處理

  // 判斷邏輯：如果標準答案是空的（如名字題），則只要有輸入都算對；否則需完全符合
  if (correct === '' || user === correct) {
    // 答對
    character2Dialogue = currentQ.correctFeedback || '答對了！';
    score += 1;
    // 給予短暫移速加成
    rewardTimer = 300;
    moveSpeed = baseMoveSpeed * 1.5;
    // 關閉輸入欄，並在較短時間內顯示回饋
    playerInput.hide();
    showDialogue = true;
    dialogueTimer = 180;
    currentQuestionIndex = -1;
    // 顯示下一題按鈕
    if (nextButton) {
      nextButton.show();
      // hide retry if visible
      if (retryButton) retryButton.hide();
    }
    // 啟動 happy 動畫
    happyAnimating = true;
    happyFrameIndex = 0;
    happyFrameCounter = 0;
  } else {
    // 答錯
    character2Dialogue = (currentQ.wrongFeedback || '答錯了') + '\n提示: ' + (currentQ.hint || '');
    showDialogue = true;
    dialogueTimer = 180;
    // 保留輸入欄讓玩家重試
    // 顯示再作答一次按鈕
    if (retryButton) {
      retryButton.show();
      if (nextButton) nextButton.hide();
    }
  }
}

function retryQuestion() {
  if (currentQuestionIndex < 0) return;
  // 顯示原題目並讓玩家再次作答
  if (currentNpc === 2) {
    character2Dialogue = questions[currentQuestionIndex].question;
  } else if (currentNpc === 3) {
    character2Dialogue = questions3[currentQuestionIndex].question;
  }
  
  showDialogue = true;
  dialogueTimer = 300;
  if (playerInput) {
    playerInput.show();
    playerInput.value('');
    playerInput.elt.focus();
  }
  if (retryButton) retryButton.hide();
}

function nextQuestion() {
  // 抽新題
  if (currentNpc === 2 && questions.length > 0) {
    const idx = floor(random(0, questions.length));
    currentQuestionIndex = idx;
    character2Dialogue = questions[idx].question;
  } else if (currentNpc === 3 && questions3.length > 0) {
    const idx = floor(random(0, questions3.length));
    currentQuestionIndex = idx;
    character2Dialogue = questions3[idx].question;
  } else {
    return;
  }
  
  showDialogue = true;
  dialogueTimer = 300;
  if (playerInput) {
    playerInput.show();
    playerInput.value('');
    playerInput.elt.focus();
  }
  if (nextButton) nextButton.hide();
  if (retryButton) retryButton.hide();
}

function mousePressed() {
  // 如果在開始畫面點擊滑鼠，則開始遊戲
  if (gameState === 'start') {
    gameState = 'playing';
    loop(); // 開始 draw() 迴圈
    // 播放音樂
    if (song) {
      song.loop();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 重新計算地面高度
  groundY = height - animation[0].height - 85;
  if (!isJumping) {
    characterY = groundY;
  }
  character2Y = groundY;
  character3Y = groundY;
}
