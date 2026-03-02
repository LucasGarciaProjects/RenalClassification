import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { tmpdir } from 'os';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const mask = formData.get('mask') as File;
    const model = formData.get('model') as string;

    if (!image || !mask || !model) {
      return NextResponse.json(
        { error: 'Missing required files or model selection' },
        { status: 400 }
      );
    }

    // Validate model - all three available models
    const validModels = ['mobilenet', 'efficientnet', 'resnet'];
    if (!validModels.includes(model)) {
      return NextResponse.json(
        { error: 'Invalid model selection' },
        { status: 400 }
      );
    }

    // Create temporary directory
    const tempDir = path.join(tmpdir(), 'kidney-prediction');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Save files with timestamp
    const timestamp = Date.now();
    const imagePath = path.join(tempDir, `image_${timestamp}.jpg`);
    const maskPath = path.join(tempDir, `mask_${timestamp}.mat`);

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const maskBuffer = Buffer.from(await mask.arrayBuffer());

    writeFileSync(imagePath, imageBuffer);
    writeFileSync(maskPath, maskBuffer);

    // Execute Python script
    const scriptPath = path.join(process.cwd(), 'server', 'scripts', 'predict.py');
    const command = `python "${scriptPath}" "${imagePath}" "${maskPath}" "${model}"`;
    
    console.log(`Executing command: ${command}`);
    
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 60000, // 60 seconds timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large images
    });

    // Clean up temporary files
    try {
      unlinkSync(imagePath);
      unlinkSync(maskPath);
    } catch (cleanupError) {
      console.warn('Error cleaning up temporary files:', cleanupError);
    }

    if (stderr) {
      console.log('Python stderr:', stderr);
    }

    // Parse the result
    const result = JSON.parse(stdout.trim());
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Return the prediction result with file information
    return NextResponse.json({
      ...result,
      imageFile: { name: image.name, size: image.size },
      maskFile: { name: mask.name, size: mask.size }
    });

  } catch (error: any) {
    console.error('Error in API predict:', error);
    
    // Clean up temporary files on error
    try {
      const tempDir = path.join(tmpdir(), 'kidney-prediction');
      if (existsSync(tempDir)) {
        const files = ['image', 'mask'].map(prefix => 
          path.join(tempDir, `${prefix}_${Date.now()}.${prefix === 'image' ? 'jpg' : 'mat'}`)
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