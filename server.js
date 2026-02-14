const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// RenderのEnvironmentにある「API_KEY」を使用
const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/generate-quiz', async (req, res) => {
    const { difficulty } = req.body;
    
    try {
        // v1で404が出る場合、SDKの自動解決に頼らず、最新モデルを明示的に指定します
        // この記述により、ライブラリ内部で正しいエンドポイントが選択されます
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `あなたは論理的思考を試すクイズ作家です。難易度[${difficulty}]で、初見の単語や記号の構造から正解を推論させるクイズを1問作成してください。
        回答は必ず以下のJSON形式のみで出力し、他の解説は含めないでください。
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

        // JSON部分だけを抽出
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const quizData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        
        res.json(quizData);

    } catch (error) {
        console.error("AI ERROR DETAILS:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running`);
});
