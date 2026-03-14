import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';
import { UserRole } from '@/models/User';
import Teacher from '@/models/Teacher';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Authorize called with:', { email: credentials?.email, password: credentials?.password ? '***' : 'empty' });
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await dbConnect();

          // Use case-insensitive email search
          const user = await User.findOne({ 
            email: { $regex: new RegExp('^' + credentials.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
          });

          if (!user) {
            console.log('User not found for email:', credentials.email);
            return null;
          }

          console.log('User found:', user.email, 'Role:', user.role);
          
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log('Invalid password for user:', user.email);
            return null;
          }

          // Check if teacher is active
          if (user.role === 'teacher') {
            const teacher = await Teacher.findOne({ userId: user._id });
            console.log('Teacher found:', teacher?._id, 'isActive:', teacher?.isActive);
            if (teacher && !teacher.isActive) {
              // Teacher is not active, deny login
              console.log('Teacher login denied: account not active');
              return null;
            }
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
