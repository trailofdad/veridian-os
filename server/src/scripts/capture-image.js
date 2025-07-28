// src/scripts/capture-image.js

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configuration - Update these variables with your Raspberry Pi's details
const SSH_USER = process.env.PI_SSH_USER || 'christian';
const PI_HOST = process.env.PI_HOST || '192.168.50.2'; // Change this to your Raspberry Pi's IP address
const PI_PORT = process.env.PI_SSH_PORT || '22';
const API_PORT = process.env.PI_API_PORT || '3001';
const LOCAL_DIR = process.env.LOCAL_IMAGE_DIR || os.homedir();

function execCommand(command, timeout = 30000) {
    return new Promise((resolve, reject) => {
        console.log(`Executing: ${command}`);
        
        const child = exec(command, { timeout }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Command failed: ${error.message}`));
                return;
            }
            
            if (stderr && !stderr.includes('Pseudo-terminal')) {
                console.warn(`Warning: ${stderr}`);
            }
            
            resolve(stdout.trim());
        });
        
        child.on('timeout', () => {
            child.kill();
            reject(new Error(`Command timed out after ${timeout}ms`));
        });
    });
}

async function validateConnection() {
    try {
        console.log('🔍 Testing SSH connection to Raspberry Pi...');
        const testCommand = `ssh -p ${PI_PORT} -o ConnectTimeout=10 ${SSH_USER}@${PI_HOST} "echo 'Connection successful'"`;
        await execCommand(testCommand, 15000);
        console.log('✅ SSH connection established');
        return true;
    } catch (error) {
        console.error('❌ SSH connection failed:', error.message);
        console.log('\n💡 Make sure:');
        console.log(`   - SSH is enabled on your Raspberry Pi`);
        console.log(`   - The IP address (${PI_HOST}) is correct`);
        console.log(`   - You can SSH manually: ssh ${SSH_USER}@${PI_HOST}`);
        console.log(`   - Your SSH keys are set up or you have password access\n`);
        return false;
    }
}

async function setupDirectories() {
    try {
        console.log('📁 Setting up timelapse directory on Raspberry Pi...');
        
        // Create the timelapse directory with proper permissions
        const setupCommands = [
            // Create the directory if it doesn't exist
            `sudo mkdir -p /timelapse`,
            // Change ownership to the current user
            `sudo chown ${SSH_USER}:${SSH_USER} /timelapse`,
            // Set proper permissions (read, write, execute for owner and group)
            `sudo chmod 775 /timelapse`,
            // Verify the directory exists and is writable
            `test -w /timelapse && echo "Directory setup successful" || echo "Directory setup failed"`
        ];
        
        const command = `ssh -p ${PI_PORT} ${SSH_USER}@${PI_HOST} "${setupCommands.join(' && ')}"`;
        const output = await execCommand(command, 30000);
        
        if (!output.includes('Directory setup successful')) {
            throw new Error('Directory setup verification failed');
        }
        
        console.log('✅ Timelapse directory setup completed');
        return true;
    } catch (error) {
        console.error('❌ Failed to setup directories:', error.message);
        console.log('\n💡 Make sure:');
        console.log(`   - Your user (${SSH_USER}) has sudo privileges`);
        console.log(`   - The Pi has sufficient disk space`);
        console.log(`   - You can run: sudo mkdir -p /timelapse\n`);
        throw error;
    }
}

async function captureImage() {
    try {
        console.log('📸 Capturing image from Raspberry Pi camera...');
        const command = `ssh -p ${PI_PORT} ${SSH_USER}@${PI_HOST} "curl -s -X POST http://localhost:${API_PORT}/api/camera/capture"`;
        const output = await execCommand(command, 45000); // Longer timeout for image capture
        
        let result;
        try {
            result = JSON.parse(output);
        } catch (parseError) {
            throw new Error(`Invalid API response: ${output}`);
        }
        
        if (result.error) {
            throw new Error(`API Error: ${result.error}`);
        }
        
        const { imagePath } = result;
        if (!imagePath) {
            throw new Error('No image path returned from API');
        }
        
        console.log(`✅ Image captured successfully: ${imagePath}`);
        return imagePath;
    } catch (error) {
        console.error('❌ Failed to capture image:', error.message);
        console.log('\n💡 Make sure:');
        console.log(`   - Your Express server is running on the Pi (port ${API_PORT})`);
        console.log(`   - The camera is properly connected and enabled`);
        console.log(`   - The /timelapse directory exists and is writable\n`);
        throw error;
    }
}

async function transferImage(remoteImagePath) {
    try {
        console.log('📁 Transferring image to local machine...');
        const imageName = path.basename(remoteImagePath);
        const localImagePath = path.join(LOCAL_DIR, imageName);
        
        // Check if local directory exists
        if (!fs.existsSync(LOCAL_DIR)) {
            throw new Error(`Local directory does not exist: ${LOCAL_DIR}`);
        }
        
        const command = `scp -P ${PI_PORT} ${SSH_USER}@${PI_HOST}:"${remoteImagePath}" "${localImagePath}"`;
        await execCommand(command, 60000); // Longer timeout for file transfer
        
        // Verify the file was transferred
        if (!fs.existsSync(localImagePath)) {
            throw new Error('File transfer completed but local file not found');
        }
        
        const stats = fs.statSync(localImagePath);
        if (stats.size === 0) {
            throw new Error('Transferred file is empty');
        }
        
        console.log(`✅ Image transferred successfully to: ${localImagePath}`);
        console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        return localImagePath;
    } catch (error) {
        console.error('❌ Failed to transfer image:', error.message);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting image capture process...');
    console.log(`📡 Target: ${SSH_USER}@${PI_HOST}:${PI_PORT}`);
    console.log(`📂 Local directory: ${LOCAL_DIR}\n`);
    
    try {
        // Validate SSH connection first
        const connectionOk = await validateConnection();
        if (!connectionOk) {
            process.exit(1);
        }
        
        // Set up directories and permissions
        await setupDirectories();
        
        // Capture image
        const remoteImagePath = await captureImage();
        
        // Transfer image
        const localImagePath = await transferImage(remoteImagePath);
        
        console.log('\n🎉 Process completed successfully!');
        console.log(`📸 Image saved to: ${localImagePath}`);
        
    } catch (error) {
        console.error('\n💥 Process failed:', error.message);
        process.exit(1);
    }
}

// Run the capture and transfer process
main();

