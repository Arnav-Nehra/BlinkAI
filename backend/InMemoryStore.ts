import type {Message} from "./types"


const EVICTION_TIME = 2 * 60 * 1000;
const EVICTION_CLOCK_TIME = 5* 60 * 1000;

export class InMemoryStore {
    private static store : InMemoryStore;
    private instance_store : Record<string,{
        messages : Message[],
        evictionTime : number;
    }>;
    
    private clock : NodeJS.Timeout;

    private constructor(){
        this.instance_store = {};
        this.clock = setInterval(()=>{
            Object.entries(this.instance_store).forEach(([key,{evictionTime}])=>{
                if(evictionTime < Date.now()){
                    delete this.instance_store[key];
                }
            });
        },EVICTION_CLOCK_TIME);
    }

    public destroy(){
        clearInterval(this.clock);
    }

    static getInstance(){
        if(!InMemoryStore.store){
            InMemoryStore.store = new InMemoryStore();
        }
        return InMemoryStore.store;
    }

    get(conversationId : string): Message[]{
        return this.instance_store[conversationId]?.messages ?? []
    }


    add(conversationId:string, message:Message){
        if(!this.instance_store[conversationId]){
            this.instance_store[conversationId] = {
                messages : [], 
                evictionTime:Date.now() + EVICTION_TIME
            }
        }
        this.instance_store[conversationId]?.messages?.push(message);
        this.instance_store[conversationId].evictionTime = Date.now() + EVICTION_TIME;
    }
}
        