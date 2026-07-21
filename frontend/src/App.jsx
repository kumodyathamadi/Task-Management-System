import React, { useState, useEffect, useMemo } from 'react';
import api from './lib/api';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import TaskFormModal from './components/TaskFormModal';
import ToastList from './components/ToastList';

// =============================================================
// App — Root orchestrator (state, logic, routing between views)
// =============================================================
export default function App() {

  // ── Theme ────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  // ── Auth ────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // ── Tasks ────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Filters ──────────────────────────────────────────────
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // ── Task Form Modal ───────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Pending',
    due_date: ''
  });
  const [formErrors, setFormErrors] = useState([]);

  // ── Toasts ───────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  // ── Login Fields ─────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ── Sidebar ──────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // =============================================================
  // Toast Helpers
  // =============================================================
  const addToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
  };

  // =============================================================
  // Task API Calls
  // =============================================================
  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get('/api/tasks');
      if (res.data.success) setTasks(res.data.tasks);
    } catch (err) {
      console.error('Fetch tasks API failed:', err);
      addToast('error', err.response?.data?.message || 'Error occurred while loading tasks.');
      if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  // =============================================================
  // Auth Handlers
  // =============================================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email: loginEmail, password: loginPassword });
      if (res.data.success) {
        const { token: jwtToken, user: userProfile } = res.data;
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userProfile));
        setToken(jwtToken);
        setUser(userProfile);
        addToast('success', `Welcome back, ${userProfile.name || 'Admin'}!`);
      }
    } catch (err) {
      console.error('Login action error:', err);
      setLoginError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setTasks([]);
    setLoginEmail('');
    setLoginPassword('');
    addToast('success', 'Logged out successfully.');
  };

  // =============================================================
  // Task Form Handlers
  // =============================================================
  const openCreateModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setEditingTask(null);
    setFormData({ title: '', description: '', priority: 'Medium', status: 'Pending', due_date: todayStr });
    setFormErrors([]);
    setIsFormOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date
    });
    setFormErrors([]);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingTask(null);
    setFormErrors([]);
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.title || formData.title.trim() === '') errors.push('Task title is required.');
    if (!formData.due_date) {
      errors.push('Due date is required.');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const parts = formData.due_date.split('-');
      let selectedDate;
      if (parts.length === 3) {
        selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        selectedDate = new Date(formData.due_date);
        selectedDate.setHours(0, 0, 0, 0);
      }
      const isDateUnchanged = editingTask && tasks.find((t) => t.id === editingTask)?.due_date === formData.due_date;
      if (!isDateUnchanged && selectedDate < today) errors.push('Due date cannot be set in the past.');
    }
    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (editingTask) {
        const res = await api.put(`/api/tasks/${editingTask}`, formData);
        if (res.data.success) { addToast('success', 'Task updated successfully.'); closeFormModal(); fetchTasks(); }
      } else {
        const res = await api.post('/api/tasks', formData);
        if (res.data.success) { addToast('success', 'Task created successfully.'); closeFormModal(); fetchTasks(); }
      }
    } catch (err) {
      console.error('Task submit failed:', err);
      setFormErrors(err.response?.data?.errors || [err.response?.data?.message || 'Failed to sync task.']);
    }
  };

  const handleInlineStatusChange = async (task, newStatus) => {
    try {
      const res = await api.put(`/api/tasks/${task.id}`, { ...task, status: newStatus });
      if (res.data.success) { addToast('success', `Status updated to ${newStatus}.`); fetchTasks(); }
    } catch (err) {
      console.error('Inline status transition failed:', err);
      addToast('error', err.response?.data?.message || 'Failed to update task status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
    try {
      const res = await api.delete(`/api/tasks/${taskId}`);
      if (res.data.success) { addToast('success', 'Task deleted.'); fetchTasks(); }
    } catch (err) {
      console.error('Delete task API call error:', err);
      addToast('error', 'Error deleting task.');
    }
  };

  // =============================================================
  // Derived State (memoised)
  // =============================================================
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    const progress = tasks.filter((t) => t.status === 'In Progress').length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = tasks.filter((t) => {
      if (t.status === 'Completed' || !t.due_date) return false;
      const parts = t.due_date.split('-');
      if (parts.length !== 3) return false;
      const taskDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return taskDate < today;
    }).length;
    return { total, pending, progress, completed, overdue };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];
    if (searchVal.trim()) list = list.filter((t) => t.title.toLowerCase().includes(searchVal.toLowerCase()));
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter) list = list.filter((t) => t.priority === priorityFilter);
    list.sort((a, b) => {
      if (sortBy === 'newest') return (new Date(b.created_at || 0)) - (new Date(a.created_at || 0));
      if (sortBy === 'oldest') return (new Date(a.created_at || 0)) - (new Date(b.created_at || 0));
      if (sortBy === 'due_date') return (a.due_date ? new Date(a.due_date) : 8640000000000000) - (b.due_date ? new Date(b.due_date) : 8640000000000000);
      if (sortBy === 'due_date_desc') return (b.due_date ? new Date(b.due_date) : -8640000000000000) - (a.due_date ? new Date(a.due_date) : -8640000000000000);
      return 0;
    });
    return list;
  }, [tasks, searchVal, statusFilter, priorityFilter, sortBy]);

  const emptyStateText = useMemo(() => {
    if (searchVal.trim()) return `No tasks found matching "${searchVal}".`;
    if (statusFilter && priorityFilter) return `No ${statusFilter.toLowerCase()} tasks with ${priorityFilter.toLowerCase()} priority found.`;
    if (statusFilter) return `No ${statusFilter.toLowerCase()} tasks found.`;
    if (priorityFilter) return `No tasks with ${priorityFilter.toLowerCase()} priority found.`;
    return "No tasks found in your control system. Click 'Create Task' above to start tracking!";
  }, [searchVal, statusFilter, priorityFilter]);

  // =============================================================
  // Render
  // =============================================================

  // ── Login Screen ─────────────────────────────────────────
  if (!token) {
    return (
      <LoginPage
        theme={theme}
        toggleTheme={toggleTheme}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginLoading={loginLoading}
        loginError={loginError}
        handleLogin={handleLogin}
        toasts={toasts}
        removeToast={removeToast}
      />
    );
  }

  // ── Dashboard Screen ──────────────────────────────────────
  return (
    <div data-theme={theme} className="app-container">
      <Dashboard
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        handleLogout={handleLogout}
        stats={stats}
        openCreateModal={openCreateModal}
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        loading={loading}
        filteredTasks={filteredTasks}
        emptyStateText={emptyStateText}
        handleInlineStatusChange={handleInlineStatusChange}
        openEditModal={openEditModal}
        handleDeleteTask={handleDeleteTask}
      />

      {/* Task Create/Edit Modal */}
      {isFormOpen && (
        <TaskFormModal
          editingTask={editingTask}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          handleFormSubmit={handleFormSubmit}
          closeFormModal={closeFormModal}
        />
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Global Toasts */}
      <ToastList list={toasts} onRemove={removeToast} />
    </div>
  );
}
