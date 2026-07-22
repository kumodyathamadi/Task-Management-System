import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all task routes
router.use(authenticateToken);

// Helper function to validate task input
function validateTaskInput(data, isUpdate = false) {
  const errors = [];
  const { title, priority, status, due_date } = data;

  // Title validation (required for creates, if provided in updates)
  if (!isUpdate || title !== undefined) {
    if (!title || typeof title !== 'string' || title.trim() === '') {
      errors.push('Task title is required and cannot be empty.');
    }
  }

  // Priority validation
  if (!isUpdate || priority !== undefined) {
    const validPriorities = ['Low', 'Medium', 'High'];
    if (!priority || !validPriorities.includes(priority)) {
      errors.push('Priority must be one of: Low, Medium, High.');
    }
  }

  // Status validation
  if (!isUpdate || status !== undefined) {
    const validStatuses = ['Pending', 'In Progress', 'Completed'];
    if (!status || !validStatuses.includes(status)) {
      errors.push('Status must be one of: Pending, In Progress, Completed.');
    }
  }

  // Due Date validation
  if (!isUpdate || due_date !== undefined) {
    if (!due_date) {
      errors.push('Due date is required.');
    } else {
      const dateVal = new Date(due_date);
      if (isNaN(dateVal.getTime())) {
        errors.push('Invalid due date format.');
      } else {
        // Compare with today's date (local midnight)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Construct target date at local midnight to avoid local-timezone vs UTC discrepancies
        const parts = due_date.split('-'); // expect YYYY-MM-DD
        let targetDate;
        if (parts.length === 3) {
          targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          targetDate = new Date(due_date);
          targetDate.setHours(0, 0, 0, 0);
        }

        if (targetDate < today) {
          errors.push('Due date cannot be in the past.');
        }
      }
    }
  }

  return errors;
}

// GET /api/tasks - Retrieve all tasks for the authenticated user (with search, filter, sort)
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const { search, status, priority, sortBy } = req.query;

  try {
    let sql = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];

    // Search filter
    if (search && search.trim() !== '') {
      sql += ' AND title LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    // Status filter
    if (status && status.trim() !== '') {
      sql += ' AND status = ?';
      params.push(status);
    }

    // Priority filter
    if (priority && priority.trim() !== '') {
      sql += ' AND priority = ?';
      params.push(priority);
    }

    // Sorting
    let orderBy = ' ORDER BY created_at DESC'; // default newest created
    if (sortBy) {
      switch (sortBy) {
        case 'newest':
          orderBy = ' ORDER BY created_at DESC';
          break;
        case 'oldest':
          orderBy = ' ORDER BY created_at ASC';
          break;
        case 'due_date':
          orderBy = ' ORDER BY due_date ASC'; // tasks due earliest first
          break;
        case 'due_date_desc':
          orderBy = ' ORDER BY due_date DESC';
          break;
        default:
          orderBy = ' ORDER BY created_at DESC';
      }
    }

    sql += orderBy;

    const tasks = await query(sql, params);
    
    // Convert SQL date and timestamp representations to clean formats
    const formattedTasks = tasks.map(task => ({
      ...task,
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : null
    }));

    return res.json({
      success: true,
      tasks: formattedTasks
    });

  } catch (error) {
    console.error('Fetch tasks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks.'
    });
  }
});

// GET /api/tasks/:id - Retrieve a single task by ID
router.get('/:id', async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  try {
    const tasks = await query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    const task = {
      ...tasks[0],
      due_date: tasks[0].due_date ? new Date(tasks[0].due_date).toISOString().split('T')[0] : null
    };

    return res.json({
      success: true,
      task
    });

  } catch (error) {
    console.error('Fetch single task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving the task.'
    });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { title, description, priority, status, due_date } = req.body;

  // Validate
  const errors = validateTaskInput({ title, priority, status, due_date }, false);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors
    });
  }

  try {
    const defaultPriority = priority || 'Medium';
    const defaultStatus = status || 'Pending';

    const result = await query(
      'INSERT INTO tasks (user_id, title, description, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title.trim(), description ? description.trim() : null, defaultPriority, defaultStatus, due_date]
    );

    const newTaskId = result.insertId;
    const createdTasks = await query('SELECT * FROM tasks WHERE id = ?', [newTaskId]);
    const createdTask = {
      ...createdTasks[0],
      due_date: createdTasks[0].due_date ? new Date(createdTasks[0].due_date).toISOString().split('T')[0] : null
    };

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: createdTask
    });

  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating the task.'
    });
  }
});

// PUT /api/tasks/:id - Update an existing task
router.put('/:id', async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;
  const { title, description, priority, status, due_date } = req.body;

  // Verify task exists and belongs to the authenticated user
  try {
    const existing = await query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or permission denied.'
      });
    }

    // Validate update fields (only validate what is provided if we want partial support, but for CRUD let's validate full or merged object)
    const mergedData = {
      title: title !== undefined ? title : existing[0].title,
      priority: priority !== undefined ? priority : existing[0].priority,
      status: status !== undefined ? status : existing[0].status,
      // Handle date verification compared to now, however for existing tasks, if the user leaves the date unchanged and it was already set (even in the past, or if we want to allow updating existing past tasks without date validation error unless the date is modified), we should handle that.
      // Let's only validate due_date if it has changed from the database.
      due_date: due_date !== undefined ? due_date : existing[0].due_date ? new Date(existing[0].due_date).toISOString().split('T')[0] : null
    };

    const isDateChanged = due_date !== undefined && due_date !== (existing[0].due_date ? new Date(existing[0].due_date).toISOString().split('T')[0] : null);

    const validationData = { ...mergedData };
    if (!isDateChanged) {
      // Bypass date checks by sending undefined or skip date validation if unchanged
      delete validationData.due_date;
    }

    const errors = validateTaskInput(validationData, true);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors
      });
    }

    // Perform update
    const updatedDescription = description !== undefined ? (description ? description.trim() : null) : existing[0].description;

    await query(
      'UPDATE tasks SET title = ?, description = ?, priority = ?, status = ?, due_date = ? WHERE id = ? AND user_id = ?',
      [mergedData.title.trim(), updatedDescription, mergedData.priority, mergedData.status, mergedData.due_date, taskId, userId]
    );

    const updatedTasks = await query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    const updatedTask = {
      ...updatedTasks[0],
      due_date: updatedTasks[0].due_date ? new Date(updatedTasks[0].due_date).toISOString().split('T')[0] : null
    };

    return res.json({
      success: true,
      message: 'Task updated successfully.',
      task: updatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating the task.'
    });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  try {
    const existing = await query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or permission denied.'
      });
    }

    await query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);

    return res.json({
      success: true,
      message: 'Task deleted successfully.'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting the task.'
    });
  }
});

export default router;
