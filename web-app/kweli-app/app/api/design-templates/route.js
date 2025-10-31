// app/api/design-templates/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/supabase';

// GET - List all templates for company
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const { data: templates, error } = await supabase
      .from('design_templates')
      .select('*')
      .eq('company_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      templates: templates || []
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      templateUrl,
      qrPlacement,
      placeholderColor,
      placeholderText
    } = body;

    // Validate required fields
    if (!name || !qrPlacement) {
      return NextResponse.json({
        success: false,
        error: 'Name and QR placement are required'
      }, { status: 400 });
    }

    // Validate placement structure
    if (!qrPlacement.x || !qrPlacement.y || !qrPlacement.width || !qrPlacement.height) {
      return NextResponse.json({
        success: false,
        error: 'QR placement must include x, y, width, and height'
      }, { status: 400 });
    }

    const { data: template, error } = await supabase
      .from('design_templates')
      .insert({
        company_id: session.user.id,
        name,
        template_url: templateUrl || null,
        qr_placement: qrPlacement,
        placeholder_color: placeholderColor || null,
        placeholder_text: placeholderText || null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update template
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, qrPlacement, placeholderColor, placeholderText } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Template ID is required'
      }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('design_templates')
      .select('company_id')
      .eq('id', id)
      .single();

    if (!existing || existing.company_id !== session.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Template not found or unauthorized'
      }, { status: 404 });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (qrPlacement) updateData.qr_placement = qrPlacement;
    if (placeholderColor !== undefined) updateData.placeholder_color = placeholderColor;
    if (placeholderText !== undefined) updateData.placeholder_text = placeholderText;

    const { data: template, error } = await supabase
      .from('design_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Template ID is required'
      }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('design_templates')
      .select('company_id')
      .eq('id', id)
      .single();

    if (!existing || existing.company_id !== session.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Template not found or unauthorized'
      }, { status: 404 });
    }

    const { error } = await supabase
      .from('design_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Set active template
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Template ID is required'
      }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('design_templates')
      .select('company_id')
      .eq('id', id)
      .single();

    if (!existing || existing.company_id !== session.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Template not found or unauthorized'
      }, { status: 404 });
    }

    // Deactivate all templates for this company
    await supabase
      .from('design_templates')
      .update({ is_active: false })
      .eq('company_id', session.user.id);

    // Activate the selected template
    const { data: template, error } = await supabase
      .from('design_templates')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Template set as active',
      template
    });
  } catch (error) {
    console.error('Error setting active template:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

