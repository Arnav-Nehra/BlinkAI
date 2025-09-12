import { Router } from "express";
import {SignInSchema, SignUpSchema} from "../types.ts"
import  jwt  from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma/client.js";

const router = Router();

const prismaClient = new PrismaClient();

router.post("/signup",async(req,res)=>{
    
    const {success,data} = SignUpSchema.safeParse(req.body);    
    
    if(!success){
        res.status(411).json("Invalid Data")
        return ;
    }

    try{

        const hashedPassword = await Bun.password.hash(data.password);
        const newUser = await prismaClient.user.create({
        data: {
            username : data.username,
            password : hashedPassword,
            name :data.name
        }
        
    })


    res.status(200).json(newUser)
    
}

    catch(err){
        console.log("user already exists");
        res.status(400).json("user already exists");
    }

})


router.get("/signin",async(req,res)=>{
    
    const {data,success} = SignInSchema.safeParse(req.body)
    
    if(!success){
        res.json(411).json("incorrect data")
    }

    try{

        const user = await prismaClient.user.findUnique({
            where: {
                username: data?.username
            }
        })

        if(user && data){

            const verifyPassowrd = await Bun.password.verify(data?.password,user.password)

            if(!verifyPassowrd){
                res.json("user not authorized");
                return ;
            }

            const jwttoken = jwt.sign({
                username : user.username , userId : user.id
            },"secret")

            res.status(200).json(jwttoken);
        }
        
    }
    catch(e){
        
        console.log(e,"signin");
        res.json("user doesn't exist");
        return ;
    }

});

export default router ;