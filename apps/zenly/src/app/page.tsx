'use client'

import App from "@/components/full-components/app";
import Loader from "@/components/full-components/loader";
import { SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";

import { SignedIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense, useEffect } from "react";
import toast from "react-hot-toast";

export default function Home(){
    
    const {isLoaded, user, isSignedIn} = useUser();


    useEffect(() => {
        function getUser(){
            if(!isLoaded){
                return <Loader />
            }
            if(isSignedIn){
                toast.success(`User is logged in ${user?.fullName}`)
                redirect('/dashboard')
            }
        }
        getUser()
    }, [ isLoaded])

    return(
        <div>
            <Suspense fallback={<Loader />}>
                <App />
            </Suspense>
        </div>
    )
}