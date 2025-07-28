// server/src/lib/camera.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Base directory for timelapse images
const TIMELAPSE_BASE_DIR = '/timelapse';

/**
 * Format date as DD-MM-YYYY for directory naming
 */
function formatDateForDirectory(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

/**
 * Parse date string (YYYY-MM-DD) to Date object
 */
function parseDateString(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Ensure directory exists, create if it doesn't
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * Capture a 1080p still image from the Raspberry Pi camera
 * Returns the path to the captured image
 */
export async function captureStillImage(): Promise<string> {
    const now = new Date();
    const dateDir = formatDateForDirectory(now);
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    
    // Create directory path: /timelapse/DD-MM-YYYY/
    const dayDirectory = path.join(TIMELAPSE_BASE_DIR, dateDir);
    await ensureDirectoryExists(dayDirectory);
    
    // Image filename with timestamp
    const filename = `image_${timestamp}.jpg`;
    const imagePath = path.join(dayDirectory, filename);
    
    try {
        // Use libcamera-still for modern Raspberry Pi OS
        // Alternative: use raspistill for older systems
        const command = `libcamera-still --output "${imagePath}" --width 1920 --height 1080 --quality 95 --timeout 1000`;
        
        console.log(`[Camera] Capturing image: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr && !stderr.includes('INFO')) {
            console.warn(`[Camera] Warning during capture: ${stderr}`);
        }
        
        // Verify the file was created
        try {
            const stats = await fs.stat(imagePath);
            if (stats.size === 0) {
                throw new Error('Captured image file is empty');
            }
        } catch (statError) {
            throw new Error(`Failed to verify captured image: ${statError}`);
        }
        
        console.log(`[Camera] Image captured successfully: ${imagePath}`);
        return imagePath;
        
    } catch (error) {
        console.error(`[Camera] Failed to capture image:`, error);
        
        // Try fallback command (raspistill for older systems)
        try {
            const fallbackCommand = `raspistill -o "${imagePath}" -w 1920 -h 1080 -q 95 -t 1000`;
            console.log(`[Camera] Trying fallback command: ${fallbackCommand}`);
            
            const { stdout, stderr } = await execAsync(fallbackCommand);
            
            if (stderr) {
                console.warn(`[Camera] Fallback warning: ${stderr}`);
            }
            
            // Verify the fallback file was created
            const stats = await fs.stat(imagePath);
            if (stats.size === 0) {
                throw new Error('Fallback captured image file is empty');
            }
            
            console.log(`[Camera] Image captured with fallback: ${imagePath}`);
            return imagePath;
            
        } catch (fallbackError) {
            throw new Error(`Camera capture failed with both methods: ${error}, ${fallbackError}`);
        }
    }
}

/**
 * Get all images for a specific date
 * @param dateStr Date in format 'YYYY-MM-DD', defaults to today
 */
export async function getImagesForDate(dateStr?: string): Promise<string[]> {
    const date = dateStr ? parseDateString(dateStr) : new Date();
    const dateDir = formatDateForDirectory(date);
    const dayDirectory = path.join(TIMELAPSE_BASE_DIR, dateDir);
    
    try {
        const files = await fs.readdir(dayDirectory);
        const imageFiles = files
            .filter(file => file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg'))
            .sort() // Sort chronologically
            .map(file => path.join(dayDirectory, file));
        
        return imageFiles;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            // Directory doesn't exist, return empty array
            return [];
        }
        throw error;
    }
}

/**
 * Create a timelapse video from images captured on a specific day
 * @param dateStr Date in format 'YYYY-MM-DD', defaults to today
 * @returns Path to the created video file
 */
export async function createTimelapseVideo(dateStr?: string): Promise<string> {
    const date = dateStr ? parseDateString(dateStr) : new Date();
    const dateDir = formatDateForDirectory(date);
    const dayDirectory = path.join(TIMELAPSE_BASE_DIR, dateDir);
    
    // Get all images for the day
    const images = await getImagesForDate(dateStr);
    
    if (images.length === 0) {
        throw new Error(`No images found for date ${dateStr || 'today'}`);
    }
    
    console.log(`[Camera] Creating timelapse from ${images.length} images`);
    
    // Output video path
    const videoFilename = `timelapse_${dateDir}.mp4`;
    const videoPath = path.join(dayDirectory, videoFilename);
    
    try {
        // Use ffmpeg to create timelapse video
        // Pattern: image_*.jpg sorted chronologically
        // -framerate: input framerate (images per second in output)
        // -r: output framerate
        // -crf: quality (lower = better quality, 18-28 is good range)
        const command = `ffmpeg -y -framerate 10 -pattern_type glob -i "${dayDirectory}/image_*.jpg" -r 30 -vf "scale=1920:1080" -c:v libx264 -crf 23 -pix_fmt yuv420p "${videoPath}"`;
        
        console.log(`[Camera] Creating timelapse: ${command}`);
        
        const { stdout, stderr } = await execAsync(command, { 
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer for ffmpeg output
        });
        
        if (stderr && !stderr.includes('frame=')) {
            console.warn(`[Camera] FFmpeg warnings: ${stderr}`);
        }
        
        // Verify the video file was created
        try {
            const stats = await fs.stat(videoPath);
            if (stats.size === 0) {
                throw new Error('Created video file is empty');
            }
        } catch (statError) {
            throw new Error(`Failed to verify created video: ${statError}`);
        }
        
        console.log(`[Camera] Timelapse video created successfully: ${videoPath}`);
        return videoPath;
        
    } catch (error) {
        console.error(`[Camera] Failed to create timelapse video:`, error);
        throw new Error(`Timelapse creation failed: ${error}`);
    }
}

/**
 * Get available timelapse dates (directories that exist)
 */
export async function getAvailableDates(): Promise<string[]> {
    try {
        const entries = await fs.readdir(TIMELAPSE_BASE_DIR, { withFileTypes: true });
        const dates = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .filter(name => /^\d{2}-\d{2}-\d{4}$/.test(name)) // Match DD-MM-YYYY format
            .sort();
        
        return dates;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}
