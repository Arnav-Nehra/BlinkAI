import Dexie, { type EntityTable } from 'dexie';


interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: "user" | "assistant";
  createdAt: Date;
}

interface Conversation {
  id: string;
  title : string;
  lastMessageAt: Date
}


const db = new Dexie('Blink') as Dexie & {
  conversations: EntityTable<Conversation, 'id'>;
  messages: EntityTable<Message, 'id'>;
};


db.version(1).stores({
  conversations: 'id, title, lastMessageAt',
  messages: 'id, conversationId, role, createdAt, content',
});

export type{Conversation,Message};
export default db;


   