import { streamText } from "ai";
import type { Message } from "./types";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const ChatCompletion = async (
    model : string,
    messages:Message[],
    cb : (chunk:string)=>void
)=>{
    
    return new Promise<void> (async(resolve,reject)=>{
    
    try{ 

    const apiKey = process.env.API_KEY;
    const google = createGoogleGenerativeAI({apiKey});
    let aiModel = google(model);


    const result = streamText({
        model : aiModel,
        messages : messages,
        onError : (error)=>{
            console.log(error);
            reject(error);
        },
        system:`
        You are BlinkAI, an ai assistant that can answer questions and help with tasks.
        Be helpful and provide relevant information
        Be respectful and polite in all interactions.
        Be engaging and maintain a conversational tone.
        Always use LaTeX for mathematical expressions - 
        Inline math must be wrapped in single dollar signs: $content$
        Display math must be wrapped in double dollar signs: $$content$$
        Display math should be placed on its own line, with nothing else on that line.
        Do not nest math delimiters or mix styles.
        Examples:
        - Inline: The equation $E = mc^2$ shows mass-energy equivalence.
        - Display: 
        $$\\frac{d}{dx}\\sin(x) = \\cos(x)$$
        `,
    });

    for await(const chunk of result.textStream){
        cb(chunk);
    }
    resolve();
}   
    catch(error){
    reject(error);    
    }
    });
}    
