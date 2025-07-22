// server/src/api/notification-routes.ts
import { Router, Request, Response } from 'express';
import { getActiveAlerts, dismissAlert, getAlertHistory, getLatestActiveAlert, getNotificationTrayItems, markAlertAsRead, getUnreadNotificationCount } from '../lib/plant-health';

const router = Router();

// GET /api/alerts
// Endpoint to retrieve active alerts
router.get('/alerts', (req: Request, res: Response) => {
    try {
        const alerts = getActiveAlerts();
        res.json(alerts);
    } catch (error) {
        console.error('[API] Error fetching alerts:', error);
        res.status(500).json({ message: 'Failed to fetch alerts.', error: (error as Error).message });
    }
});

// POST /api/alerts/:id/dismiss
// Endpoint to dismiss an alert
router.post('/alerts/:id/dismiss', (req: Request, res: Response) => {
    const alertId = parseInt(req.params.id);
    const { auto_dismissed, mark_as_read } = req.body;
    
    if (isNaN(alertId)) {
        return res.status(400).json({ message: 'Invalid alert ID.' });
    }
    
    try {
        const success = dismissAlert(alertId, auto_dismissed === true, mark_as_read === true);
        if (success) {
            res.json({ message: 'Alert dismissed successfully.' });
        } else {
            res.status(404).json({ message: 'Alert not found or already dismissed.' });
        }
    } catch (error) {
        console.error('[API] Error dismissing alert:', error);
        res.status(500).json({ message: 'Failed to dismiss alert.', error: (error as Error).message });
    }
});

// GET /api/alerts/history
// Endpoint to retrieve alert history
// Optional query parameter: ?limit=N (number of results)
router.get('/alerts/history', (req: Request, res: Response) => {
    const { limit } = req.query;
    let limitNum = 50; // Default limit
    
    if (typeof limit === 'string' && !isNaN(parseInt(limit))) {
        limitNum = parseInt(limit);
    }
    
    try {
        const history = getAlertHistory(limitNum);
        res.json(history);
    } catch (error) {
        console.error('[API] Error fetching alert history:', error);
        res.status(500).json({ message: 'Failed to fetch alert history.', error: (error as Error).message });
    }
});

// GET /api/alerts/latest
// Endpoint to retrieve the latest active alert for main notification display
router.get('/alerts/latest', (req: Request, res: Response) => {
    try {
        const latestAlert = getLatestActiveAlert();
        res.json(latestAlert);
    } catch (error) {
        console.error('[API] Error fetching latest alert:', error);
        res.status(500).json({ message: 'Failed to fetch latest alert.', error: (error as Error).message });
    }
});

// GET /api/notifications/tray
// Endpoint to retrieve notification tray items (dismissed but unread alerts)
router.get('/notifications/tray', (req: Request, res: Response) => {
    try {
        const trayItems = getNotificationTrayItems();
        res.json(trayItems);
    } catch (error) {
        console.error('[API] Error fetching notification tray:', error);
        res.status(500).json({ message: 'Failed to fetch notification tray.', error: (error as Error).message });
    }
});

// GET /api/notifications/unread-count
// Endpoint to get unread notification count for badge
router.get('/notifications/unread-count', (req: Request, res: Response) => {
    try {
        const count = getUnreadNotificationCount();
        res.json({ count });
    } catch (error) {
        console.error('[API] Error fetching unread count:', error);
        res.status(500).json({ message: 'Failed to fetch unread count.', error: (error as Error).message });
    }
});

// POST /api/notifications/:id/mark-read
// Endpoint to mark a notification as read
router.post('/notifications/:id/mark-read', (req: Request, res: Response) => {
    const alertId = parseInt(req.params.id);
    
    if (isNaN(alertId)) {
        return res.status(400).json({ message: 'Invalid alert ID.' });
    }
    
    try {
        const success = markAlertAsRead(alertId);
        if (success) {
            res.json({ message: 'Notification marked as read.' });
        } else {
            res.status(404).json({ message: 'Notification not found.' });
        }
    } catch (error) {
        console.error('[API] Error marking notification as read:', error);
        res.status(500).json({ message: 'Failed to mark notification as read.', error: (error as Error).message });
    }
});

export default router;
