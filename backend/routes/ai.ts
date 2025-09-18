import { Router, type Request, type Response } from "express";
import { InMemoryStore } from "../InMemoryStore.js";
import { ChatCompletion } from "../openai.js";
import { z } from "zod";
import { CreateChatSchema, Role } from "../types.js";

const router = Router();


router.post("/aliveConversations",async(req,res)=>{
    const BodySchema = z.object({ ids: z.array(z.string()) });
    const parsed = BodySchema.safeParse(req.body);
    if(!parsed.success){
        return res.status(400).json({ error: "invalid_body" });
    }
    const aliveIds = InMemoryStore.getInstance().areConversationAlive(parsed.data.ids);
    res.json({ alive: aliveIds });
})

router.post("/chat",async(req:Request,res:Response)=>{
  
    
    const {success,data} = CreateChatSchema.safeParse(req.body);
    let conversationId = data?.conversationId
    if(!success){
        return res.status(400).json({ error: "invalid_body"});
    }
     
    
    if(!conversationId){
        return res.status(400).json({ error: "conversationId_required" });
    }
  
   

    const model = "gemini-2.5-flash"

    let existingMessages = InMemoryStore.getInstance().get(conversationId);
    if(!existingMessages.length && data?.existingMessages?.length){
        for (const message of data.existingMessages){
            InMemoryStore.getInstance().add(conversationId,{
                role: message.role as Role,
                content: message.content
            })
        }
        existingMessages = InMemoryStore.getInstance().get(conversationId);
    }
    
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();




    let message = "";
    
    try{
        console.log("messages ->", [...existingMessages, { role: Role.User, content: data.message }]);
        await ChatCompletion(model,[...existingMessages,{
            role : Role.User,
            content : data?.message 
        }],(chunk:string)=>{
            message += chunk;
            res.write(`data: ${JSON.stringify({content : chunk})}\n\n`);
        })
        res.write(`data: ${JSON.stringify({done : true})}\n\n`);
    }
    catch(e){
        res.write(`data: ${JSON.stringify({error:"failed to generate response"})}\n\n`)
    }
    finally{
        res.end();
    }

    InMemoryStore.getInstance().add(conversationId,{
        role:Role.User,
        content:data.message
    })
 

    InMemoryStore.getInstance().add(conversationId,{
        role:Role.Agent,
        content:message
    })

    
});

export default router;
