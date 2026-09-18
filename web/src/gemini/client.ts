import { parseFoodAnalysisText, type FoodAnalysisJson } from "../domain/foodAnalysis";
import { FOOD_ANALYSIS_PROMPT } from "./config";
import { generateGeminiText } from "./generate";
import { fileToJpegBase64 } from "./image";

export async function analyzeFoodPhoto(
  file: File,
  apiKey: string,
): Promise<FoodAnalysisJson> {
  if (!apiKey) throw new Error("还没有填写 Gemini API Key，请到「我的」里保存。也可改用手填。");
  const base64 = await fileToJpegBase64(file);
  const text = await generateGeminiText(apiKey, [
    { text: FOOD_ANALYSIS_PROMPT },
    { inline_data: { mime_type: "image/jpeg", data: base64 } },
  ]);
  return parseFoodAnalysisText(text);
}
