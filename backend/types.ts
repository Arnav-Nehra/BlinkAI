import {z} from "zod";


const MAX_INPUT_TOKENS = 1000;

export type Message = {
  content: string;
  role: Role;
}

export enum Role {
  Agent = "assistant",
  User = "user"
}


export const  CreateChatSchema = z.object({
  conversationId : z.uuid().optional(),
  message : z.string().max(MAX_INPUT_TOKENS),
  existingMessages : z.array(
    z.object({
      content: z.string(),
      role: z.enum(["user", "assistant"]),
    })
  ).optional()
})
