import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force Node.js runtime instead of edge for Supabase compatibility if needed
export const runtime = 'nodejs';

// Add CORS headers for the OPTIONS preflight request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId, adminPass, certificate_number, is_premium_unlocked } = body;

    // Verify Admin Credentials (matching their old panel exactly)
    const validId = process.env.CERTIFICATE_ADMIN_ID || "admin@nlitedu.com";
    const validPass = process.env.CERTIFICATE_ADMIN_PASS || "NLITedu@certificate";

    if (!adminId || !adminPass || adminId !== validId || adminPass !== validPass) {
      return NextResponse.json(
        { error: "Unauthorized admin credentials." },
        { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (!certificate_number) {
      return NextResponse.json(
        { error: "Certificate number is required" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Connect to Supabase using the Service Role Key (Bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://othxceezbpfiauaevibt.supabase.co";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
       return NextResponse.json(
        { error: "Server missing Supabase Service Role Key." },
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceKey);

    // Upsert the lock status into the independent certiva_locks table
    const { data, error } = await adminSupabase
      .from("certiva_locks")
      .upsert(
        { 
          certificate_number, 
          is_premium_unlocked,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'certificate_number' }
      )
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    return NextResponse.json(
      { success: true, updated: data },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err: any) {
    console.error("Error updating premium status:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
