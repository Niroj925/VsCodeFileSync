import OpenAI from "openai";
import * as dotenv from "dotenv";
import { getOpenaiKey } from "../utils/get-openai-key";

dotenv.config();
const {key}=getOpenaiKey();
export const openai = new OpenAI({
  apiKey: key??'',
});