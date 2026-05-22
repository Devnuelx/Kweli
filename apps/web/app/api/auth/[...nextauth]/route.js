// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import { supabase } from "@/lib/supabase/supabase";
// import bcrypt from "bcrypt";

// export const authOptions = {
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         const { data: company } = await supabase
//           .from('companies')
//           .select('*')
//           .eq('email', credentials.email)
//           .single();
        
//         if (!company) {
//           throw new Error('No account found with this email.');
//         }
        
//         const isValid = await bcrypt.compare(
//           credentials.password, 
//           company.password_hash
//         );
        
//         if (!isValid) {
//           throw new Error('Invalid password');
//         }
        
//         return {
//           id: company.id,
//           email: company.email,
//           name: company.name
//         };
//       }
//     })
//   ],
//   pages: {
//     signIn: '/login',
//     error: '/login',
//   },
//   session: {
//     strategy: "jwt",
//   },
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (token) {
//         session.user.id = token.id;
//       }
//       return session;
//     },
//     // SIMPLIFIED REDIRECT - This is the key fix
//     async redirect({ url, baseUrl }) {
//       // If redirecting to login or signup pages after auth, go to dashboard instead
//       if (url.includes('/login') || url.includes('/signup')) {
//         return `${baseUrl}/dashboard`;
//       }
      
//       // Allow relative callback URLs
//       if (url.startsWith("/")) return `${baseUrl}${url}`;
//       // Allow callback URLs on the same origin
//       else if (new URL(url).origin === baseUrl) return url;
      
//       // Default to dashboard
//       return `${baseUrl}/dashboard`;
//     }
//   }
// };

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };




// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase/supabase";
import bcrypt from "bcrypt";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('email', credentials.email)
            .single();
          
          if (!company) {
            throw new Error('No account found with this email.');
          }
          
          const isValid = await bcrypt.compare(
            credentials.password, 
            company.password_hash
          );
          
          if (!isValid) {
            throw new Error('Invalid password');
          }
          
          return {
            id: company.id,
            email: company.email,
            name: company.name
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
    // SIMPLEST REDIRECT - No complex logic
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after successful login
      return `${baseUrl}/dashboard`;
    }
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };