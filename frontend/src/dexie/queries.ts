import db from "./db"

export const getConversations = async () => {
   return await db.conversations.orderBy('lastMessageAt').reverse().toArray();
};

export const createConversation = async(id:string,title:string)=>{
    return await db.conversations.add({
        id,
        title,
        lastMessageAt : new Date()
    })
}

export const deleteConversation = async(id:string)=>{
    return await db.transaction(
        'rw',
        [db.conversations,db.messages],
        async()=>{
            await db.messages.where('conversationId').equals(id).delete();
            return await db.conversations.where('id').equals(id).delete();
        }
    )
}

export const getMessagesByConversationId = async(conversationId : string)=>{
    return await db.messages
        .where('conversationId')
        .equals(conversationId)
        .sortBy('createdAt');
}

export const createMessage = async (content: string, conversationId: string,role: "user" | "assistant",lastMessageAt:Date) => {
  return await db.transaction('rw', [db.messages, db.conversations], async () => {
    await db.messages.add({
      id: crypto.randomUUID().toString(),
      content,
      conversationId,
      createdAt: new Date(),
      role
    });

    await db.conversations.update(conversationId,{
        lastMessageAt 
    })
  });
};
