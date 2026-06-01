// ==========================================
// ⚙️ AP MindMap Anki - GAS Backend (v2)
// ⚠️ このコードを Apps Script エディタに貼り付けてデプロイしてください ⚠️
// ==========================================

const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const SHEET_NAME = "シート1"; // ご自身のシート名に合わせて変更してください

// スプレッドシートを取得するヘルパー
function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss) throw new Error('スプレッドシートが見つかりません。SPREADSHEET_ID を確認してください。');
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('シートが見つかりません: ' + SHEET_NAME);
  return sheet;
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    if (action === 'upload') {
      const base64Data = postData.image;
      const mimeType = postData.mimeType || 'image/jpeg';
      
      const newCard = processImageWithGemini(base64Data, mimeType);
      const savedCard = saveToSpreadsheet(newCard);
      
      return createJsonResponse({ status: 'success', data: savedCard });
    }

    return createJsonResponse({ status: 'error', message: 'Unknown action' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function doGet(e) {
  try {
    const sheet = getSheet();
    
    // A2からQ列の最終行まで取得 (17列)
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return createJsonResponse({ status: 'success', data: [] });
    }
    
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 17);
    const values = dataRange.getValues();
    
    const cards = values.map(row => ({
      id: row[0],
      question: row[1],
      category: row[2],
      sub_category: row[3],
      text_question: row[4],
      choice_a: row[5],
      choice_b: row[6],
      choice_c: row[7],
      choice_d: row[8],
      correct_answer: row[9],
      explanation_conclusion: row[10],
      explanation_analogy: row[11],
      explanation_trap: row[12],
      search_key: row[13],
      past_url: row[14],
      status: row[15],
      review_level: row[16]
    }));
    
    return createJsonResponse({ status: 'success', data: cards });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------
// 🧠 Gemini API 連携ロジック
// ------------------------------------------
function processImageWithGemini(base64Image, mimeType) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
あなたは「応用情報技術者試験」の超優秀な家庭教師です。
提供された過去問のスクリーンショット画像を読み取り、以下のJSONフォーマットで完全に解析してください。

【3つの解説ルールを絶対に守ること】
1. 結論ファースト (explanation_conclusion): まずは正解の記号と、その理由を一言でズバッと答えてください。
2. 超絶かみ砕き解説 (explanation_analogy): 教科書的な専門用語の羅列は禁止。必ず「料理」「お店の経営」「日常生活のトラブル」などの『身近な例え話』に変換し、直感的にイメージできるよう徹底的に翻訳してください。
3. 引っかかりやすい罠の指摘 (explanation_trap): 「なぜ他の選択肢を選ぶと間違えるのか」「人間の直感や勘違いを利用した、どんな引っかけが仕組まれているか」を具体的に分析し、回避策を教えてください。

【JSONフォーマット要件】
{
  "question": "抽出した中心的な用語（例：WAF、アジャイル）",
  "category": "大カテゴリ（例：テクノロジ系）",
  "sub_category": "小カテゴリ（例：セキュリティ）",
  "text_question": "画像内の問題文全体を抽出",
  "choice_a": "アの選択肢の文章",
  "choice_b": "イの選択肢の文章",
  "choice_c": "ウの選択肢の文章",
  "choice_d": "エの選択肢の文章",
  "correct_answer": "正解の記号（ア、イ、ウ、エ のいずれか1文字）",
  "explanation_conclusion": "上記ルール1に基づく結論ファーストの解説",
  "explanation_analogy": "上記ルール2に基づく超かみ砕いた例え話解説",
  "explanation_trap": "上記ルール3に基づく引っかかりやすい罠の指摘",
  "search_key": "画像の出所である過去問道場の検索キー（例：令和5年秋期 問36、わからなければ空白）"
}

必ず上記のキー名をもつJSON形式のみを出力してください（マークダウンのバッククォート \`\`\`json などは不要です）。
  `;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image
          }
        }
      ]
    }]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());

  if (json.error) {
    throw new Error("Gemini API Error: " + JSON.stringify(json.error));
  }

  const rawText = json.candidates[0].content.parts[0].text;
  const cleanJsonText = rawText.replace(/```json\n?|```/g, '').trim();
  
  try {
    return JSON.parse(cleanJsonText);
  } catch (e) {
    throw new Error("Geminiが正しいJSONを返しませんでした: " + cleanJsonText);
  }
}

// ------------------------------------------
// 🌐 過去問道場 URL生成ロジック
// ------------------------------------------
function getPastQuestionUrl(searchKey) {
  if (!searchKey) return "";
  const regex = /(令和|平成|R|H)\s*(\d+)\s*年?\s*(春期|秋期|春|秋)\s*問\s*(\d+)/i;
  const match = searchKey.match(regex);
  if (!match) return "";

  const year = parseInt(match[2], 10);
  const term = match[3];
  const qNum = parseInt(match[4], 10);

  const yearStr = year < 10 ? `0${year}` : `${year}`;

  let termStr = "";
  if (term.indexOf('春') !== -1) {
    termStr = "haru";
  } else if (term.indexOf('秋') !== -1) {
    termStr = "aki";
  }

  if (!yearStr || !termStr) return "";

  return `https://www.ap-siken.com/kakomon/${yearStr}_${termStr}/q${qNum}.html`;
}

// ------------------------------------------
// 💾 スプレッドシート保存ロジック (17列構成)
// ------------------------------------------
function saveToSpreadsheet(cardData) {
  const sheet = getSheet();

  const newId = 'card-' + new Date().getTime();
  const status = '未定着';
  const level = 1;
  const pastUrl = getPastQuestionUrl(cardData.search_key);

  const newRow = [
    newId,                                 // A(1): ID
    cardData.question || '',               // B(2): 用語
    cardData.category || '',               // C(3): 大カテゴリ
    cardData.sub_category || '',           // D(4): 小カテゴリ
    cardData.text_question || '',          // E(5): 問題文
    cardData.choice_a || '',               // F(6): 選択肢ア
    cardData.choice_b || '',               // G(7): 選択肢イ
    cardData.choice_c || '',               // H(8): 選択肢ウ
    cardData.choice_d || '',               // I(9): 選択肢エ
    cardData.correct_answer || '',         // J(10): 正解
    cardData.explanation_conclusion || '', // K(11): 結論
    cardData.explanation_analogy || '',    // L(12): 例え話
    cardData.explanation_trap || '',       // M(13): 罠
    cardData.search_key || '',             // N(14): 検索キー
    pastUrl,                               // O(15): 過去問URL
    status,                                // P(16): 状態
    level                                  // Q(17): レベル
  ];

  sheet.appendRow(newRow);

  return {
    id: newId,
    question: cardData.question,
    category: cardData.category,
    sub_category: cardData.sub_category,
    text_question: cardData.text_question,
    choice_a: cardData.choice_a,
    choice_b: cardData.choice_b,
    choice_c: cardData.choice_c,
    choice_d: cardData.choice_d,
    correct_answer: cardData.correct_answer,
    explanation_conclusion: cardData.explanation_conclusion,
    explanation_analogy: cardData.explanation_analogy,
    explanation_trap: cardData.explanation_trap,
    search_key: cardData.search_key,
    past_url: pastUrl,
    status: status,
    review_level: level
  };
}
