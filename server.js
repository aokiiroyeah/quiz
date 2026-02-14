const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/generate-quiz', async (req, res) => {
    const { difficulty } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `あなたは論理的思考を試すクイズ作家です。難易度[${difficulty}]で、初見の単語や記号の構造から正解を推論させるクイズを1問作成し、以下のJSON形式のみで出力してください。
    {"questionNumber": 1, "question": "問題文", "answerOptions": [{"text": "選択肢", "rationale": "論理的根拠", "isCorrect": true}]}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        // JSON以外の余計な文字を削除してパース
        const text = response.text().replace(/```json|```/g, '');
        res.json(JSON.parse(text));
} catch (error) {
        console.error("DEBUG ERROR:", error.message); // これで詳細がわかります
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
