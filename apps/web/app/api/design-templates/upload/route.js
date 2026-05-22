// app/api/design-templates/upload/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase/supabase";
import { QrEmbedder } from "@/lib/services/qr/QrEmbedder";

export const runtime = "nodejs";

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(request) {
  console.log("🧩 Upload route triggered!");
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const formData = await request.formData();
    const designFile = formData.get("design");

    if (!designFile) {
      return NextResponse.json({
        success: false,
        error: "Design file is required",
      }, { status: 400 });
    }

    const arrayBuffer = await designFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const validation = await QrEmbedder.validateDesign(buffer);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: "Invalid design file",
        details: validation.errors,
      }, { status: 400 });
    }

    const timestamp = Date.now();
    const extension = designFile.name.split(".").pop();
    const filename = `template_${timestamp}.${extension}`;
    const filePath = `templates/${session.user.id}/${filename}`;

    const { data, error } = await supabase.storage
      .from("product-designs")
      .upload(filePath, buffer, {
        contentType: designFile.type,
        cacheControl: "3600",
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("product-designs")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      templateUrl: publicUrl,
      metadata: validation.metadata,
      filename,
    });

  } catch (error) {
    console.error("Template upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
