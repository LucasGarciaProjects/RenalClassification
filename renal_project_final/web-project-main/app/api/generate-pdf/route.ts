import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { tmpdir } from 'os';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Exportar explícitamente el método POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify we have the required data
    if (!body || !body.class || !body.confidence) {
      console.log('Missing required data in request body:', body);
      return NextResponse.json(
        { error: 'Missing required data in request body' },
        { status: 400 }
      );
    }

    // Create temporary directory for PDF
    const tempDir = path.join(tmpdir(), 'kidney-pdf');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Create temporary JSON file with data
    const timestamp = Date.now();
    const jsonPath = path.join(tempDir, `analysis_${timestamp}.json`);
    const outputPath = path.join(tempDir, `kidney_report_${timestamp}.pdf`);

    // Save data to JSON file
    writeFileSync(jsonPath, JSON.stringify(body, null, 2), 'utf8');

    // Execute Python script to generate PDF
    const scriptPath = path.join(process.cwd(), 'server', 'scripts', 'generate_pdf.py');
    const command = `python "${scriptPath}" "${jsonPath}" "${outputPath}"`;
    
    console.log(`Executing PDF generation command: ${command}`);
    
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 30000, // 30 seconds timeout
      maxBuffer: 5 * 1024 * 1024 // 5MB buffer
    });

    if (stderr) {
      console.log('PDF generation stderr:', stderr);
    }

    // Verify if PDF was created
    if (!existsSync(outputPath)) {
      console.log('PDF file was not created');
      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: 500 }
      );
    }

    // Read the generated PDF
    const pdfBuffer = require('fs').readFileSync(outputPath);

    // Clean up temporary files
    try {
      unlinkSync(jsonPath);
      unlinkSync(outputPath);
    } catch (cleanupError) {
      console.warn('Error cleaning up temporary files:', cleanupError);
    }

    // Return the PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="kidney_analysis_report_${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('Error in PDF generation:', error);
    
    // Clean up temporary files on error
    try {
      const tempDir = path.join(tmpdir(), 'kidney-pdf');
      if (existsSync(tempDir)) {
        const files = ['analysis', 'kidney_report'].map(prefix => 
          path.join(tempDir, `${prefix}_${Date.now()}.${prefix === 'analysis' ? 'json' : 'pdf'}`)
        );
        files.forEach(file => {
          if (existsSync(file)) unlinkSync(file);
        });
      }
    } catch (cleanupError) {
      console.warn('Error cleaning up on error:', cleanupError);
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 