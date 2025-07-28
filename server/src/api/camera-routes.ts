// server/src/api/camera-routes.ts
import { Router, Request, Response } from 'express';
import { captureStillImage, createTimelapseVideo } from '../lib/camera';

const router = Router();

// POST /api/camera/capture
// Endpoint to capture a 1080p still image from the camera
router.post('/camera/capture', async (req: Request, res: Response) => {
    try {
        const imagePath = await captureStillImage();
        res.json({ 
            message: 'Image captured successfully',
            imagePath,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[API] Error capturing image:', error);
        res.status(500).json({ 
            message: 'Failed to capture image', 
            error: (error as Error).message 
        });
    }
});

// POST /api/camera/timelapse
// Endpoint to create a timelapse video for a given day
// Body: { date: 'YYYY-MM-DD' } (optional, defaults to today)
router.post('/camera/timelapse', async (req: Request, res: Response) => {
    try {
        const { date } = req.body;
        const videoPath = await createTimelapseVideo(date);
        res.json({ 
            message: 'Timelapse video created successfully',
            videoPath,
            date: date || new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('[API] Error creating timelapse:', error);
        res.status(500).json({ 
            message: 'Failed to create timelapse video', 
            error: (error as Error).message 
        });
    }
});

// GET /api/camera/images/:date
// Endpoint to list all images for a given date
// Params: date in format 'YYYY-MM-DD'
router.get('/camera/images/:date', async (req: Request, res: Response) => {
    try {
        const { date } = req.params;
        const { getImagesForDate } = await import('../lib/camera');
        const images = await getImagesForDate(date);
        res.json({ 
            date,
            images,
            count: images.length
        });
    } catch (error) {
        console.error('[API] Error fetching images:', error);
        res.status(500).json({ 
            message: 'Failed to fetch images', 
            error: (error as Error).message 
        });
    }
});

// GET /api/camera/dates
// Endpoint to get all available dates with timelapse images
router.get('/camera/dates', async (req: Request, res: Response) => {
    try {
        const { getAvailableDates } = await import('../lib/camera');
        const dates = await getAvailableDates();
        res.json({ 
            dates,
            count: dates.length
        });
    } catch (error) {
        console.error('[API] Error fetching available dates:', error);
        res.status(500).json({ 
            message: 'Failed to fetch available dates', 
            error: (error as Error).message 
        });
    }
});

export default router;
