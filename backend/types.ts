import { password } from "bun";
import type { Request } from "express";
import {z} from "zod";


const MAX_INPUT_TOKENS = 1000;

export type Message = {
  content: string;
  role: Role;
}
export type ModelSchema = {
  id : string,
  name :string
}
export const MODELS : ModelSchema[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
  },
]

export const SUPPORTED_MODELS = MODELS.map(model => model.id);

export enum Role {
  Agent = "assistant",
  User = "user"
}
export const SignUpSchema = z.object({
   username : z.email(),
   password : z.string().min(8).max(20),
   name :  z.string().max(10)
})
 
export const SignInSchema = z.object({
  username : z.string(),
  password: z.string().min(8).max(20)
})

export interface CustomRequest extends Request{
  userId? : string
}
 
export const  CreateChatSchema = z.object({
  conversationId : z.uuid().optional(),
  message : z.string().max(MAX_INPUT_TOKENS),
  model:z.enum(SUPPORTED_MODELS)
})