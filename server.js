const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// APIキーの取得
const apiKey = process.env.API_KEY;

// 404を回避するため、あえて古いSDKの挙動を抑制し、最新のエンドポイントを狙い撃ちします
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/generate-quiz', async (req, res) => {
    const { difficulty } = req.body;
    
    try {
        // モデル名を最も標準的なものに。これで404が出る場合は、
        // リージョン（地域）制限の可能性が高いため、エラー詳細を強化します。
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `あなたは論理的思考を試すクイズ作家です。難易度[${difficulty}]で、初見の単語や記号の構造から正解を推論させるクイズを1問作成してください。
        必ず以下のJSON形式のみで出力してください。
        {
          "question": "問題文",
          "answerOptions": [
            {"text": "選択肢1", "rationale": "根拠1", "isCorrect": true},
            {"text": "選択肢2", "rationale": "根拠2", "isCorrect": false},
            {"text": "選択肢3", "rationale": "根拠3", "isCorrect": false}
          ]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const quizData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        
        res.json(quizData);

    } catch (error) {
        // エラー詳細をさらに具体的にログ出し
        console.error("DEBUG ERROR DETAILS:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Server running and waiting for requests...");
});
