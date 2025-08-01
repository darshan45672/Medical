// src/app/api/users/route.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

      return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
  
  export async function POST(request: Request) {
    try {
      const { name, email, password, role, phone, address } = await request.json();
  
      if (!name || !email || !password) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
  
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
  
      if (existingUser) {
        return NextResponse.json({ error: "User already exists" }, { status: 409 });
      }
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || "USER",
          phone,
          address,
        },
      });
  
      return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
