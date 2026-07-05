import { NextResponse } from "next/server";

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ 
    success: false, 
    error: message,
    timestamp: new Date().toISOString() 
  }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ 
    success: true, 
    data,
    timestamp: new Date().toISOString() 
  }, { status });
}
