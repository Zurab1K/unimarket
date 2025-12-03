"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [action, setAction] = useState("Sign Up");

  // Track form inputs
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypedPassword, setRetypedPassword] = useState("");
  const [shakeForm, setShakeForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    (async () => {
      const skipAuth =
        typeof window !== "undefined" &&
        (sessionStorage.getItem("skipAuth") === "true" ||
          localStorage.getItem("skipAuth") === "true");

      if (typeof window !== "undefined" && localStorage.getItem("skipAuth") === "true") {
        localStorage.removeItem("skipAuth");
        sessionStorage.setItem("skipAuth", "true");
      }
      if (skipAuth) {
        const completed =
          typeof window !== "undefined" &&
          localStorage.getItem("onboardingComplete") === "true";
        if (completed) {
          router.replace("/home");
        } else {
          router.replace("/onboarding");
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const completed =
        typeof window !== "undefined" &&
        localStorage.getItem("onboardingComplete") === "true";
      if (session && completed) {
        router.replace("/home");
      } else if (session) {
        router.replace("/onboarding");
      }
    })();
  }, [router]);
  
  async function handleSubmit() {

    if (action === "Sign Up") {

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error || !data.user) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);

        setErrorMessage(error?.message || "Signup failed.");
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          username: username,
        });

      if (profileError) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);

        if (profileError.code === "23505") {
          setErrorMessage("Username already taken!");
          return;
        }

        setErrorMessage(profileError.message);
        return;
      }

      setErrorMessage("");
      if (typeof window !== "undefined") {
        localStorage.removeItem("onboardingComplete");
      }
      router.push("/onboarding");
    }

    if (action === "Log In") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("onboardingComplete");
        }
        router.push("/onboarding");
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-white to-red-100">
      <div className="text-center w-full max-w-md">
        <h1 className="text-6xl font-bold mb-4 text-black select-none font-sans">Your Campus</h1>
        <h1 className="text-6xl font-bold mb-4 text-red-600 select-none font-sans">UniMarket</h1>

        <div className="flex items-center justify-center">
          <p className="text-lg text-gray-700 mb-5 whitespace-nowrap select-none font-semibold font-sans">
            Buy and sell dorm essentials, textbooks, and more with fellow students!
          </p>
        </div>

        {/* Top Buttons */}
        <div className="space-x-4 mb-3">
          <button
            onClick={() => {
              setAction("Sign Up");
              setErrorMessage("");
            }}
            className={`px-6 py-1 select-none rounded-lg transform transition duration-200 hover:scale-90 ${
              action === "Sign Up"
                ? "bg-red-600 text-white"
                : "border-2 border-red-600 text-red-600 bg-white"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => {
              setAction("Log In");
              setErrorMessage("");
            }}
            className={`px-6 py-1 select-none rounded-lg transform transition duration-200 hover:scale-90 ${
              action === "Log In"
                ? "bg-red-600 text-white"
                : "border-2 border-red-600 text-red-600 bg-white"
            }`}
          >
            Log In
          </button>
        </div>

        {/* Inputs */}

        <div className={`flex items-center justify-center flex-col space-y-1 mb-4 ${shakeForm ? "animate-shake" : ""}`}>
          
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-3/4 border border-gray-300 px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-black"
          />

          {action === "Sign Up" && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-3/4 border border-gray-300 px-2 py-1 rounded-lg focus:outline-none text-black"
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-3/4 border border-gray-300 px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-black"
          />
          
          {action === "Sign Up" && ( 
            <input
              type="password"
              placeholder="Retype Password"
              value={retypedPassword}
              onChange={(e) => setRetypedPassword(e.target.value)}
              className="w-3/4 border border-gray-300 px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-black"
            /> 
          )}

          {errorMessage != "" && ( 
            <p className="text-sm text-red-800 mb-0 whitespace-nowrap font-semibold font-sans"> 
              {errorMessage}
            </p>
          )}
         
        </div>

        {/* Bottom Button */}
        <div className="space-x-4">
          <button
           
            onClick={async () => {
              
              setErrorMessage("");

              if (action === "Sign Up" && retypedPassword !== password) {
                setShakeForm(true);
                setTimeout(() => setShakeForm(false), 300);
                setErrorMessage("Passwords do not Match!");
                return;
              }

              await handleSubmit();
            }}

        className="bg-red-600 text-white px-6 py-3 rounded-lg transform transition duration-200 hover:scale-90 select-none"
      >
        {action}
      </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("skipAuth", "true");
                localStorage.removeItem("onboardingComplete");
              }
              router.push("/onboarding");
            }}
            className="ml-3 border-2 border-red-600 text-red-600 px-6 py-3 rounded-lg transform transition duration-200 hover:scale-90 select-none"
          >
            Skip
          </button>
        </div>


      </div>
    </main>
  );
}
