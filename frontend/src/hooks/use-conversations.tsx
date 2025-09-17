import { BACKEND_URL, Messages } from "@/types";

const useConversation = async(conversationId : string)=>{

    const token = localStorage.getItem("token");
    
    if(!token || !conversationId){
        return;
    }

    const response = await fetch(`${BACKEND_URL}/ai/conversation/${conversationId}`,
        {
            headers : {
                "Authorization" : `Bearer ${token}`
            }
        }
    )
    const data : Messages[] = await response.json()
    
    if(!response.ok){
        throw new Error("error fetching messages")
    }

    return data;
}

export default useConversation;