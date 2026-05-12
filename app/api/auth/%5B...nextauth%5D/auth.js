import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import api from "@/lib/api";
import { ENDPOINTS } from "@/config/endpoints";

export const authOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Call the real backend login endpoint
          const response = await api.post(ENDPOINTS.USER.LOGIN, {
            email: credentials.email,
            password: credentials.password
          });
          
          if (response && response.token) {
            // Return user object with token
            return {
              id: response.user._id,
              name: `${response.user.firstName} ${response.user.lastName}`,
              email: response.user.email,
              accessToken: response.token
            };
          }
          return null;
        } catch (error) {
          // Pass the error message from the backend
          throw new Error(error?.message || "Invalid email or password");
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
