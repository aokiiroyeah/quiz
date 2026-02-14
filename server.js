const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// APIキーの取得
const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/generate-quiz', async (req, res) => {
    const { difficulty } = req.body;
    
    if (!apiKey) {
        return res.status(500).json({ error: "APIキーが設定されていません。" });
    }

    try {
        // モデル名を最新の安定版 'gemini-1.5-flash-latest' に指定
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `あなたは論理的思考を試すクイズ作家です。難易度[${difficulty}]で、初見の単語や記号の構造から正解を推論させるクイズを1問作成してください。
        回答は必ず以下のJSON形式のみで出力し、他の解説テキストは一切含めないでください。
        {
          "question": "問題文",
          "answerOptions": [
            {"text": "選択肢1", "rationale": "論理的根拠1", "isCorrect": true},
            {"text": "選択肢2", "rationale": "論理的根拠2", "isCorrect": false},
            {"text": "選択肢3", "rationale": "論理的根拠3", "isCorrect": false}
          ]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) text = jsonMatch[0];

        const quizData = JSON.parse(text);
        res.json(quizData);

    } catch (error) {
        console.error("AI ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
