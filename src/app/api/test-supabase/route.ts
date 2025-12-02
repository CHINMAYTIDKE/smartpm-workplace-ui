import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Test endpoint to verify Supabase connection
export async function GET(request: NextRequest) {
    try {
        console.log("Testing Supabase connection...");

        // Test if we can list buckets
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({
                success: false,
                error: error.message,
                details: error
            }, { status: 500 });
        }

        console.log("Buckets found:", buckets);

        return NextResponse.json({
            success: true,
            message: "Supabase connection successful!",
            buckets: buckets.map(b => ({ name: b.name, public: b.public }))
        });
    } catch (error: any) {
        console.error("Exception:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Unknown error"
        }, { status: 500 });
    }
}
