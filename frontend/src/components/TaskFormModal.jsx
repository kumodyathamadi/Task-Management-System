import React from 'react';
import { X } from 'lucide-react';

// ---------------------------------------------------------
// TaskFormModal — Create / Edit task dialog
// ---------------------------------------------------------
export default function TaskFormModal({
  editingTask,
  formData,
  setFormData,
  formErrors,
  handleFormSubmit,
  closeFormModal
}) {
  return (
    <div className="modal-overlay" onClick={closeFormModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Modal header */}
        <div className="modal-header">
          <h3 className="modal-title">
            {editingTask ? 'Modify Task Details' : 'Register New Task'}
          </h3>
          <button className="modal-close-btn" onClick={closeFormModal}>
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <form
          onSubmit={handleFormSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
        >
          <div className="modal-body">

            {/* Validation errors */}
            {formErrors.length > 0 && (
              <div className="form-errors-list">
                <h4>Review needed parameters:</h4>
                <ul>
                  {formErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="taskTitle">Task Title *</label>
              <input
                id="taskTitle"
                type="text"
                className="form-input"
                placeholder="Enter short task name"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="taskDescription">Task Description</label>
              <textarea
                id="taskDescription"
                className="form-textarea"
                placeholder="Provide details about the task..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Priority & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="taskPriority">Priority *</label>
                <select
                  id="taskPriority"
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="taskStatus">Status *</label>
                <select
                  id="taskStatus"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Due date */}
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label" htmlFor="taskDueDate">Scheduled Date *</label>
              <input
                id="taskDueDate"
                type="date"
                className="form-input"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>

          </div>

          {/* Footer actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeFormModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingTask ? 'Save Task' : 'Register Task'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
