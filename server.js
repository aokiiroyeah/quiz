const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 環境変数からAPIキーを取得。RenderのEnvironmentで設定した名前と一致させる必要があります
const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/generate-quiz', async (req, res) => {
    const { difficulty } = req.body;
    
    // APIキー自体が存在しない場合のチェック
    if (!apiKey) {
        console.error("CRITICAL ERROR: API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: "サーバー側にAPIキーが設定されていません。" });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        // デバッグログ：AIが何を返してきたかRenderのLogsに表示
        console.log("AI Response Raw Text:", text);

        // AIがMarkdownの ```json ... ``` をつけてきた場合のクリーニング
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }

        const quizData = JSON.parse(text);
        res.json(quizData);

    } catch (error) {
        // RenderのLogsにエラーの詳細を表示させる
        console.error("--- DEBUG ERROR START ---");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("--- DEBUG ERROR END ---");

        res.status(500).json({ 
            error: "AI生成に失敗しました。詳細はサーバーログを確認してください。",
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 10000;
app.
