import { Router, type Response } from "express";
import { authMiddleware } from "../authMiddleware";
import { CreateChatSchema, MODELS, Role, type CustomRequest } from "../types";
import { PrismaClient } from "../generated/prisma/client.js";
import { InMemoryStore } from "../InMemoryStore.js";
import { ChatCompletion } from "../openai.js";
import { json } from "zod";

const router = Router();
const prismaClient = new PrismaClient();
router.get("/conversation/:conversationId",authMiddleware,async(req:CustomRequest,res:Response)=>{
    const userId = req.userId   
    const conversationId = req.params.conversationId;

    if(!userId && !conversationId){
        return;
    }

    try {
        
        const conversation = await prismaClient.conversation.findUnique({
            where : {
             id:conversationId,
             userId : userId
            }
        }            
        );
        if(conversation === null){
            res.json("no conversation found")
            return;
        }
        res.json(conversation); 
    }   
    catch(e){
        res.json("error fetching conversation");
        return;
    }

})

router.get("/conversation",authMiddleware,async(req:CustomRequest,res:Response)=>{
    const userId = req.userId;
    try{
        const conversations = await prismaClient.conversation.findMany({
        where: {
            userId : userId
        },
        })
        res.json(conversations);
        }
    catch(e){
        console.log("error fetching conversations")
        res.json("error fetching conversations")
        return;
    }
})


router.post("/chat",authMiddleware,async(req:CustomRequest,res:Response)=>{
  
    const userId = req.userId; 
    const {success,data} = CreateChatSchema.safeParse(req.body);
   
    if(!userId){
        return;
    }
   
    let conversationId = data?.conversationId;

    if(!conversationId){
        const newConversation = await prismaClient.conversation.create({data : {userId}})
        conversationId = newConversation.id;
    }
   
   if(!success){
    res.json("incorrect inputs");
    return;
    }
 
    const model = MODELS.find((model) => model.id === data.model);

    let existingMessages = InMemoryStore.getInstance().get(conversationId);
   
    if(!existingMessages.length){
        const messages = await prismaClient.message.findMany({
            where:{
                conversationId 
            }
        })
        messages.map((message)=>{
            InMemoryStore.getInstance().add(conversationId,{
                role:message.role as Role,
                content:message.content
            })
        })
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
        await ChatCompletion(data.model,[...existingMessages,{
            role : Role.User,
            content : data.message 
        }],(chunk:string)=>{
            message += chunk;
            res.write(`data:${JSON.stringify({content : chunk})}\n\n`);
        })
        res.write(`data : ${JSON.stringify({done : true})}\n\n`);
    }
    catch(e){
        res.write(`data:${JSON.stringify({error:"failed to generate response"})}\n\n`)
    }
    finally{
        res.end();
    }

    InMemoryStore.getInstance().add(conversationId,{
        role:Role.User,
        content:data.message
    })

    InMemoryStore.getInstance().add(conversationId,{
        role:Role.User,
        content:data.message
    })

    InMemoryStore.getInstance().add(conversationId,{
        role:Role.Agent,
        content:message
    })

    await prismaClient.$transaction([
        prismaClient.message.createMany({
            data:[
                {
                    conversationId,
                    content:data.message,
                    role:Role.User
                },
                {
                    conversationId,
                    content:message,
                    role:Role.Agent
                },
            ]
        })
    ])
});

export default router;
