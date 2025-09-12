import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken"
import type { CustomRequest } from "./types";

export const authMiddleware = (req:CustomRequest,res:Response,next:NextFunction)=>{
    const authToken = req.headers.authorization?.split(" ")[1];

    if(!authToken){
        res.json("auth token invalid")
        return; 
    }


    try{
        const data = jwt.verify(authToken,"secret");
        if(typeof(data) === "string" || !("userId" in data)){
            res.json("invalid token");
            return;
        }
        req.userId = data.userId 
        next();
    }
    catch(e){
        console.log(e);
        res.json("auth token invalid");
        return;
    }
}