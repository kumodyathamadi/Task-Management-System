import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  LogOut,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Play,
  Sun,
  Moon
} from 'lucide-react';
import { formatLocalDate } from '../lib/api';

// ---------------------------------------------------------
// Dashboard — TopBar + Stats + Filters + Task Grid
// ---------------------------------------------------------
export default function Dashboard({
  theme,
  toggleTheme,
  user,
  handleLogout,
  stats,
  openCreateModal,
  // Filter controls
  searchVal,
  setSearchVal,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  sortBy,
  setSortBy,
  // Task list
  loading,
  filteredTasks,
  emptyStateText,
  // Task actions
  handleInlineStatusChange,
  openEditModal,
  handleDeleteTask
}) {
  return (
    <div className="dashboard-wrapper">

      {/* Main Workspace Panel */}
      <div className="main-panel">

        {/* ── Top Navigation Bar ─────────────────────────── */}
        <header className="top-bar">
          <div className="top-bar-left">
            <span className="nav-logo-text" style={{ color: 'white', fontWeight: 800, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} /> My Task Manager
            </span>
          </div>

          <div className="top-bar-right">
            <button
              type="button"
              className="top-theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="top-bar-user">
              <div className="top-bar-user-avatar">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <span>{user?.name || 'Administrator'}</span>
            </div>

            <button className="btn-signout" onClick={handleLogout} title="Sign Out">
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* ── Scrolling Content Area ─────────────────────── */}
        <main className="content-area">

          {/* Welcome / Stats Card */}
          <div className="welcome-card-contain">
            <h1 className="welcome-title-glow">Welcome to My Task Manager Dashboard</h1>
            <p className="welcome-desc-text">
              Your centralized hub for tracking, managing, and analyzing tasks to ensure timely resolution and optimal productivity.
            </p>

            {/* KPI Stats Grid */}
            <div className="stats-grid-5">

              <div className="stat-item-card card-total">
                <div className="stat-item-left">
                  <span className="stat-item-num">{stats.total}</span>
                  <span className="stat-item-name">Total Tasks</span>
                </div>
                <div className="stat-item-right-icon"><LayoutDashboard size={48} /></div>
              </div>

              <div className="stat-item-card card-blue">
                <div className="stat-item-left">
                  <span className="stat-item-num">{stats.pending}</span>
                  <span className="stat-item-name">Pending Tasks</span>
                </div>
                <div className="stat-item-right-icon"><Clock size={48} /></div>
              </div>

              <div className="stat-item-card card-orange">
                <div className="stat-item-left">
                  <span className="stat-item-num">{stats.progress}</span>
                  <span className="stat-item-name">In Progress Tasks</span>
                </div>
                <div className="stat-item-right-icon"><Play size={48} /></div>
              </div>

              <div className="stat-item-card card-green">
                <div className="stat-item-left">
                  <span className="stat-item-num">{stats.completed}</span>
                  <span className="stat-item-name">Completed Tasks</span>
                </div>
                <div className="stat-item-right-icon"><CheckCircle2 size={48} /></div>
              </div>

              <div className="stat-item-card card-red">
                <div className="stat-item-left">
                  <span className="stat-item-num">{stats.overdue}</span>
                  <span className="stat-item-name">Overdue Tasks</span>
                </div>
                <div className="stat-item-right-icon"><AlertTriangle size={48} /></div>
              </div>

            </div>

            {/* Create Task CTA */}
            <button className="btn-raise-ticket-black" onClick={openCreateModal}>
              <Plus size={16} />
              <span>CREATE TASK</span>
            </button>
          </div>

          {/* ── Filter Controls Bar ────────────────────────── */}
          <section className="controls-card">
            <div className="controls-form">

              {/* Search */}
              <div className="search-field">
                <span className="input-icon"><Search size={16} /></span>
                <input
                  type="text"
                  className="form-input has-icon"
                  placeholder="Search tasks by title..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                />
              </div>

              {/* Dropdowns */}
              <div className="filter-group">

                <div className="filter-select-wrapper">
                  <span className="filter-label">Status</span>
                  <select
                    className="form-select control-dropdown"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <span className="filter-label">Priority</span>
                  <select
                    className="form-select control-dropdown"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <span className="filter-label">Sort By</span>
                  <select
                    className="form-select control-dropdown"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest Created</option>
                    <option value="oldest">Oldest Created</option>
                    <option value="due_date">Due Date</option>
                    <option value="due_date_desc">Due Date (Latest)</option>
                  </select>
                </div>

              </div>
            </div>
          </section>

          {/* ── Task Grid ─────────────────────────────────── */}
          <section className="tasks-container">
            {loading ? (
              <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div style={{ height: '36px', width: '36px', border: '3px solid rgba(64, 186, 170, 0.2)', borderTopColor: 'var(--brand-teal)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Syncing task repository...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="tasks-empty">
                <span className="empty-icon">📁</span>
                <p className="empty-text">{emptyStateText}</p>
              </div>
            ) : (
              <div className="task-grid">
                {filteredTasks.map((task) => {
                  // Compute overdue flag per card
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const parts = task.due_date ? task.due_date.split('-') : [];
                  let isTaskOverdue = false;
                  if (parts.length === 3 && task.status !== 'Completed') {
                    const taskDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    isTaskOverdue = taskDate < today;
                  }

                  return (
                    <div key={task.id} className="task-card">

                      {/* Badges row */}
                      <div className="task-card-header">
                        <span className={`badge badge-${task.priority.toLowerCase()}`}>
                          {task.priority} Priority
                        </span>

                        {/* Inline status selector */}
                        <select
                          className={`inline-status-select status-${task.status.toLowerCase().replace(' ', '-')}`}
                          value={task.status}
                          onChange={(e) => handleInlineStatusChange(task, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      {/* Content */}
                      <h3 className="task-title" title={task.title}>{task.title}</h3>
                      <p className="task-description">
                        {task.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No details provided.</span>}
                      </p>

                      {/* Footer */}
                      <div className="task-footer">
                        <div className="task-meta-left">
                          <div className={`due-date-row ${isTaskOverdue ? 'overdue' : ''}`}>
                            <Calendar size={13} />
                            <span>Due: {formatLocalDate(task.due_date)}</span>
                            {isTaskOverdue && (
                              <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 'bold' }}>
                                OVERDUE
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="task-actions">
                          <button className="action-btn action-btn-edit" onClick={() => openEditModal(task)} title="Edit task">
                            <Edit size={14} />
                          </button>
                          <button className="action-btn action-btn-delete" onClick={() => handleDeleteTask(task.id)} title="Delete task">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}
