"use server"

import { APIError } from "better-auth/api"
import { auth } from "./auth/auth"
import { redirect } from "next/navigation"
import db from "@/db";
import { user as userTable } from "@/db/schema"
import { eq } from "drizzle-orm";




interface State {
    errorMessage?:string | null;
}

export async function signUp(prevState: State, formData: FormData) {
    const rawFormData = {
        firstname: formData.get("firstname") as string,
        lastname: formData.get("lastname") as string,
        email: formData.get("email") as string,
        password: formData.get("pwd") as string,
    }

   const {firstname, lastname, email, password} = rawFormData

   try {
    await auth.api.signUpEmail({
        body: {
            name: `${firstname} ${lastname}`,
            email,
            password,
        }
    })
   } catch (error) {
    if (error instanceof APIError) {
        switch (error.status){
            case "UNPROCESSABLE_ENTITY":
                return {errorMessage: "User already exists"}
            case "BAD_REQUEST":
                return {errorMessage: "Invalid email"}
            default:
                return {errorMessage: "Something went wrong"}
        }
    }
    console.log("signup with email and password is not working",error)

   }
    
  redirect("/dashboard")  
}   
export async function signIn(prevState: State, formData: FormData) {
    const rawFormData = {
        email: formData.get("email") as string,
        password: formData.get("pwd") as string,
    }

   const {email, password} = rawFormData

   try {
    await auth.api.signInEmail({
        body: {
            email,
            password,
        }
    })
   } catch (error) {
    if (error instanceof APIError) {
        switch (error.status){
            case "UNAUTHORIZED":
                return {errorMessage: "Invalid email or password"}
            case "BAD_REQUEST":
                return {errorMessage: "Invalid email"}
            default:
                return {errorMessage: "Something went wrong"}
        }
    }
    console.log("signin with email and password is not working", error)

   }
    
  redirect("/dashboard")  
}   



export async function searchAccount(email: string) {
     const existing =await db.query.user.findFirst({
        where: eq(userTable.email, email),
        columns: {
            id: true,
        }
})
    return !!existing;
}

