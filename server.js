const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/generate-quiz', async (req, res) => {
    const { difficulty } = req.body;
    
    // 試行するモデルの優先順位
    const modelsToTry = ["gemini-1.5-flash", "gemini-pro"];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting to generate quiz with: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `あなたは論理的思考を試すクイズ作家です。難易度[${difficulty}]で、初見の単語や記号の構造から正解を推論させるクイズを1問作成してください。
            回答は必ず以下のJSON形式のみで出力してください。
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
            
            // 成功したらレスポンスを返して終了
            return res.json(quizData);

        } catch (error) {
            console.error(`Failed with ${modelName}:`, error.message);
            lastError = error;
            // 次のモデルを試行
            continue;
        }
    }

    // すべてのモデルで失敗した場合
    res.status(500).json({ 
        error: "すべてのモデルで生成に失敗しました。", 
        details: lastError.message 
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running`);
});
