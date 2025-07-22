import { Router, Request, Response } from 'express';
import { getDbInstance } from '../db/db';

const router = Router();

// Create User
router.post('/users', (req: Request, res: Response) => {
    const db = getDbInstance();
    const { username, email, passwordHash, fullName } = req.body;

    try {
        const insertStmt = db.prepare(`
            INSERT INTO users (username, email, password_hash, full_name)
            VALUES (?, ?, ?, ?)
        `);

        const result = insertStmt.run(username, email, passwordHash, fullName);
        res.status(201).json({ message: 'User created successfully', userId: result.lastInsertRowid });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Failed to create user', error: (error as Error).message });
    }
});

// Get User
router.get('/users/:id', (req: Request, res: Response) => {
    const db = getDbInstance();
    const userId = parseInt(req.params.id);

    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).json({ message: 'Failed to retrieve user', error: (error as Error).message });
    }
});

// Update User
router.put('/users/:id', (req: Request, res: Response) => {
    const db = getDbInstance();
    const userId = parseInt(req.params.id);
    const { username, email, passwordHash, fullName, isActive, isAdmin } = req.body;

    try {
        const updateStmt = db.prepare(`
            UPDATE users SET 
            username = ?,
            email = ?,
            password_hash = ?,
            full_name = ?,
            is_active = ?,
            is_admin = ?
            WHERE id = ?
        `);
        const result = updateStmt.run(username, email, passwordHash, fullName, isActive, isAdmin, userId);
        if (result.changes > 0) {
            res.json({ message: 'User updated successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user', error: (error as Error).message });
    }
});

// Delete User
router.delete('/users/:id', (req: Request, res: Response) => {
    const db = getDbInstance();
    const userId = parseInt(req.params.id);

    try {
        const deleteStmt = db.prepare('DELETE FROM users WHERE id = ?');
        const result = deleteStmt.run(userId);
        if (result.changes > 0) {
            res.json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user', error: (error as Error).message });
    }
});

// Get User Settings
router.get('/users/:id/settings', (req: Request, res: Response) => {
    const db = getDbInstance();
    const userId = parseInt(req.params.id);

    try {
        const settings = db.prepare(`
            SELECT setting_key, setting_value, setting_type 
            FROM user_settings 
            WHERE user_id = ?
        `).all(userId);
        
        // Convert to key-value object for easier frontend consumption
        const settingsObj = settings.reduce((acc: Record<string, any>, setting: any) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
        }, {});
        
        res.json(settingsObj);
    } catch (error) {
        console.error('Error retrieving user settings:', error);
        res.status(500).json({ message: 'Failed to retrieve user settings', error: (error as Error).message });
    }
});

// Update User Setting
router.put('/users/:id/settings/:key', (req: Request, res: Response) => {
    const db = getDbInstance();
    const userId = parseInt(req.params.id);
    const settingKey = req.params.key;
    const { value, type = 'string' } = req.body;

    try {
        const upsertStmt = db.prepare(`
            INSERT INTO user_settings (user_id, setting_key, setting_value, setting_type, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, setting_key) DO UPDATE SET
                setting_value = excluded.setting_value,
                setting_type = excluded.setting_type,
                updated_at = CURRENT_TIMESTAMP
        `);
        
        upsertStmt.run(userId, settingKey, value, type);
        res.json({ message: 'User setting updated successfully' });
    } catch (error) {
        console.error('Error updating user setting:', error);
        res.status(500).json({ message: 'Failed to update user setting', error: (error as Error).message });
    }
});

// Delete User Setting
router.delete('/users/:id/settings/:key', (req: Request, res: Response) => {
    const db = getDbInstance();
    const userId = parseInt(req.params.id);
    const settingKey = req.params.key;

    try {
        const deleteStmt = db.prepare(`
            DELETE FROM user_settings 
            WHERE user_id = ? AND setting_key = ?
        `);
        
        const result = deleteStmt.run(userId, settingKey);
        if (result.changes > 0) {
            res.json({ message: 'User setting deleted successfully' });
        } else {
            res.status(404).json({ message: 'User setting not found' });
        }
    } catch (error) {
        console.error('Error deleting user setting:', error);
        res.status(500).json({ message: 'Failed to delete user setting', error: (error as Error).message });
    }
});

export default router;

