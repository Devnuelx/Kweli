// "use client";

// import { useState, Suspense } from "react";
// import { signIn } from "next-auth/react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Shield, ArrowLeft, Loader2 } from "lucide-react";

// function LoginForm() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError("");

//     try {
//       const result = await signIn("credentials", {
//         email,
//         password,
//         redirect: false,
//       });

//       if (result?.error) {
//         setError("Invalid credentials. Please try again.");
//       } else {
//         // Success! Redirect to the intended page or dashboard
//         console.log("Login successful, redirecting to:", callbackUrl);
//         window.location.href = callbackUrl;
//       }
//     } catch (error) {
//       console.error("Login error:", error);
//       setError("An error occurred. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background african-pattern flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         {/* Header */}
//         <div className="text-center">
//           <Link href="/" className="inline-flex items-center space-x-2 mb-6">
//             <ArrowLeft className="w-5 h-5" />
//             <span>Back to Home</span>
//           </Link>
          
//           <div className="flex items-center justify-center space-x-2 mb-6">
//             <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
//               <Shield className="w-6 h-6 text-white" />
//             </div>
//             <span className="text-2xl font-bold">Kweli</span>
//           </div>
          
//           <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
//           <p className="text-muted-foreground">
//             Sign in to your company dashboard
//           </p>
//         </div>

//         {/* Login Form */}
//         <Card className="glass-effect">
//           <CardHeader>
//             <CardTitle>Sign In</CardTitle>
//             <CardDescription>
//               Enter your credentials to access your dashboard
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               {error && (
//                 <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
//                   {error}
//                 </div>
//               )}
              
//               <div>
//                 <label htmlFor="email" className="block text-sm font-medium mb-2">
//                   Email
//                 </label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="company@example.com"
//                   required
//                   className="glass-effect"
//                 />
//               </div>
              
//               <div>
//                 <label htmlFor="password" className="block text-sm font-medium mb-2">
//                   Password
//                 </label>
//                 <Input
//                   id="password"
//                   type="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Enter your password"
//                   required
//                   className="glass-effect"
//                 />
//               </div>
              
//               <Button 
//                 type="submit" 
//                 className="w-full" 
//                 disabled={isLoading}
//               >
//                 {isLoading ? (
//                   <>
//                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                     Signing in...
//                   </>
//                 ) : (
//                   "Sign In"
//                 )}
//               </Button>
//             </form>
            
//             <div className="mt-6 text-center">
//               <p className="text-sm text-muted-foreground">
//                 Don&apos;t have an account?{" "}
//                 <Link href="/signup" className="text-primary hover:underline">
//                   Create one here
//                 </Link>
//               </p>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Demo Credentials */}
//         <Card className="glass-effect">
//           <CardContent className="pt-6">
//             <div className="text-center">
//               <h3 className="font-semibold mb-2">Demo Credentials</h3>
//               <p className="text-sm text-muted-foreground mb-4">
//                 Use any email and password to create a demo account
//               </p>
//               <div className="space-y-2 text-sm">
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Email:</span>
//                   <span className="font-mono">demo@kweli.com</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Password:</span>
//                   <span className="font-mono">password123</span>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

// // Wrap the component that uses useSearchParams in Suspense
// export default function LoginPage() {
//   return (
//     <Suspense fallback={
//       <div className="min-h-screen bg-background african-pattern flex items-center justify-center">
//         <div className="flex items-center space-x-2">
//           <Loader2 className="w-6 h-6 animate-spin" />
//           <span>Loading...</span>
//         </div>
//       </div>
//     }>
//       <LoginForm />
//     </Suspense>
//   );
// }



"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import Logo from "@/public/icon.png";
import Image from "next/image";



export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use redirect: false to handle errors manually
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Handle redirect manually to show errors
        callbackUrl: "/dashboard"
      });

      if (result?.error) {
        // Show specific error messages
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else {
          setError("Login failed. Please try again.");
        }
        setIsLoading(false);
      } else if (result?.ok) {
        // Success! Redirect to dashboard
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background african-pattern flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-grotesk">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Image src={Logo} alt="Kweli" className="w-5 h-5 text-white" width={20} height={20} />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground">
            Sign in to your company dashboard
          </p>
        </div>

        {/* Login Form */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-800 dark:text-red-300">{error}</p>
                      <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                        Don&apos;t have an account? <Link href="/signup" className="underline font-semibold hover:text-red-900 dark:hover:text-red-200">Sign up here</Link>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="company@example.com"
                  required
                  className="glass-effect"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="glass-effect"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        {/* <Card className="glass-effect">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Demo Credentials</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use any email and password to create a demo account
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono">demo@kweli.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Password:</span>
                  <span className="font-mono">password123</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}