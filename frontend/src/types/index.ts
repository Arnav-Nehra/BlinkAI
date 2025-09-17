export interface Execution {
  id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface Messages{
  id : string 
  content : string
  role : "user" | "assistant";
}

export const BACKEND_URL  = "http://localhost:3000"
