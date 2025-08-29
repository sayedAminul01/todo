class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('alienwebTasks')) || [];
        this.currentFilter = 'all';
        this.darkMode = JSON.parse(localStorage.getItem('alienwebDarkMode')) || false;
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.applyTheme();
        this.render();
        this.updateStats();
    }

    bindEvents() {
        document.getElementById('addBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('navDarkToggle')?.addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('printBtn').addEventListener('click', () => this.printTasks());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportAsImage());
        
        // Scroll to top functionality
        const scrollBtn = document.getElementById('scrollToTop');
        if (scrollBtn) {
            scrollBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    scrollBtn.classList.add('visible');
                } else {
                    scrollBtn.classList.remove('visible');
                }
            });
        }
        document.getElementById('clearCompleted').addEventListener('click', () => this.clearCompleted());
        document.getElementById('clearAll').addEventListener('click', () => this.clearAll());
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const priority = document.getElementById('prioritySelect').value;
        const dueDate = document.getElementById('dueDateInput').value;
        const text = input.value.trim();
        
        if (!text) return;
        
        const task = {
            id: Date.now(),
            text,
            priority,
            dueDate: dueDate || null,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        this.updateStats();
        input.value = '';
        document.getElementById('dueDateInput').value = '';
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
            this.updateStats();
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const newText = prompt('Edit task:', task.text);
            if (newText !== null && newText.trim()) {
                task.text = newText.trim();
                this.saveTasks();
                this.render();
            }
        }
    }

    deleteTask(id) {
        if (confirm('Delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.render();
            this.updateStats();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTasks() {
        let filtered = this.tasks;
        
        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(t => 
                t.text.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }
        
        // Apply category filter
        switch (this.currentFilter) {
            case 'completed':
                return filtered.filter(t => t.completed);
            case 'pending':
                return filtered.filter(t => !t.completed);
            case 'high':
                return filtered.filter(t => t.priority === 'high');
            case 'today':
                return filtered.filter(t => this.isDueToday(t));
            case 'overdue':
                return filtered.filter(t => this.isOverdue(t));
            default:
                return filtered;
        }
    }

    render() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();
        
        taskList.innerHTML = filteredTasks.map(task => {
            const dueDateInfo = this.getDueDateInfo(task);
            return `
                <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}" draggable="true">
                    <div class="drag-handle" title="Drag to reorder">☰</div>
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="app.toggleTask(${task.id})"></div>
                    <div class="task-content">
                        <span class="task-text">${this.escapeHtml(task.text)}</span>
                        ${dueDateInfo.html}
                    </div>
                    <span class="priority-badge priority-${task.priority}" onclick="app.editPriority(${task.id})" title="Click to change priority">${task.priority}</span>
                    <div class="task-actions">
                        <button class="edit-btn" onclick="app.editTask(${task.id})" title="Edit">✏️</button>
                        <button class="delete-btn" onclick="app.deleteTask(${task.id})" title="Delete">🗑️</button>
                    </div>
                </li>
            `;
        }).join('');
        
        this.addDragListeners();
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const today = this.tasks.filter(t => this.isDueToday(t) && !t.completed).length;
        const thisWeek = this.tasks.filter(t => this.isDueThisWeek(t) && !t.completed).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('todayTasks').textContent = today;
        document.getElementById('weekTasks').textContent = thisWeek;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.applyTheme();
        this.saveTasks();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
        const toggles = [document.getElementById('darkModeToggle'), document.getElementById('navDarkToggle')];
        toggles.forEach(toggle => {
            if (toggle) toggle.textContent = this.darkMode ? '☀️' : '🌓';
        });
    }

    printTasks() {
        const printWindow = window.open('', '_blank');
        const tasks = this.tasks;
        const completedTasks = tasks.filter(t => t.completed);
        const pendingTasks = tasks.filter(t => !t.completed);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Todo List - ${new Date().toLocaleDateString()}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    h2 { color: #666; margin-top: 30px; }
                    .task { margin: 10px 0; padding: 8px; border-left: 4px solid #ddd; }
                    .high { border-left-color: #ff6b6b; }
                    .medium { border-left-color: #feca57; }
                    .low { border-left-color: #96ceb4; }
                    .completed { text-decoration: line-through; opacity: 0.7; }
                    .priority { font-size: 0.8em; color: #666; text-transform: uppercase; }
                    .stats { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
                </style>
            </head>
            <body>
                <h1>Todo List</h1>
                <div class="stats">
                    <strong>Summary:</strong> ${tasks.length} total tasks, 
                    ${completedTasks.length} completed, ${pendingTasks.length} pending
                </div>
                
                <h2>Pending Tasks (${pendingTasks.length})</h2>
                ${pendingTasks.map(task => `
                    <div class="task ${task.priority}">
                        <strong>${this.escapeHtml(task.text)}</strong>
                        <span class="priority">[${task.priority} priority]</span>
                    </div>
                `).join('')}
                
                <h2>Completed Tasks (${completedTasks.length})</h2>
                ${completedTasks.map(task => `
                    <div class="task completed ${task.priority}">
                        <strong>${this.escapeHtml(task.text)}</strong>
                        <span class="priority">[${task.priority} priority]</span>
                    </div>
                `).join('')}
                
                <div style="margin-top: 40px; text-align: center; color: #666; font-size: 0.9em;">
                    Generated on ${new Date().toLocaleString()}
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    clearCompleted() {
        if (confirm('Clear all completed tasks?')) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.render();
            this.updateStats();
        }
    }

    clearAll() {
        if (confirm('Clear all tasks? This cannot be undone.')) {
            this.tasks = [];
            this.saveTasks();
            this.render();
            this.updateStats();
        }
    }
    
    editPriority(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const priorities = ['low', 'medium', 'high'];
            const currentIndex = priorities.indexOf(task.priority);
            const nextIndex = (currentIndex + 1) % priorities.length;
            task.priority = priorities[nextIndex];
            this.saveTasks();
            this.render();
        }
    }
    
    addDragListeners() {
        const taskItems = document.querySelectorAll('.task-item');
        let draggedElement = null;
        
        taskItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedElement = item;
                item.style.opacity = '0.5';
            });
            
            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
                draggedElement = null;
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedElement && draggedElement !== item) {
                    const draggedId = parseInt(draggedElement.dataset.id);
                    const targetId = parseInt(item.dataset.id);
                    
                    const draggedIndex = this.tasks.findIndex(t => t.id === draggedId);
                    const targetIndex = this.tasks.findIndex(t => t.id === targetId);
                    
                    if (draggedIndex !== -1 && targetIndex !== -1) {
                        const draggedTask = this.tasks.splice(draggedIndex, 1)[0];
                        this.tasks.splice(targetIndex, 0, draggedTask);
                        this.saveTasks();
                        this.render();
                    }
                }
            });
        });
    }

    saveTasks() {
        localStorage.setItem('alienwebTasks', JSON.stringify(this.tasks));
        localStorage.setItem('alienwebDarkMode', JSON.stringify(this.darkMode));
    }
    
    handleSearch(query) {
        this.searchQuery = query;
        this.render();
    }
    
    isDueToday(task) {
        if (!task.dueDate) return false;
        const today = new Date().toISOString().split('T')[0];
        return task.dueDate === today;
    }
    
    isDueThisWeek(task) {
        if (!task.dueDate) return false;
        const today = new Date();
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= weekFromNow;
    }
    
    isOverdue(task) {
        if (!task.dueDate || task.completed) return false;
        const today = new Date().toISOString().split('T')[0];
        return task.dueDate < today;
    }
    
    getDueDateInfo(task) {
        if (!task.dueDate) return { html: '', class: '' };
        
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date(task.dueDate);
        const formattedDate = dueDate.toLocaleDateString();
        
        if (task.dueDate < today && !task.completed) {
            return { html: `<span class="task-date overdue">Overdue: ${formattedDate}</span>`, class: 'overdue' };
        } else if (task.dueDate === today) {
            return { html: `<span class="task-date today">Due Today</span>`, class: 'today' };
        } else {
            return { html: `<span class="task-date">Due: ${formattedDate}</span>`, class: '' };
        }
    }
    
    exportAsImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = Math.max(600, this.tasks.length * 60 + 200);
        
        // Background
        ctx.fillStyle = this.darkMode ? '#1a1a2e' : '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title
        ctx.fillStyle = this.darkMode ? '#f1f2f6' : '#2c3e50';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('🛸 AlienWeb Todo', 50, 60);
        
        // Date
        ctx.font = '16px Arial';
        ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, 50, 90);
        
        // Tasks
        let y = 140;
        this.tasks.forEach((task, index) => {
            const priorityColors = {
                high: '#8b0000',
                medium: '#cc6600',
                low: '#006400'
            };
            
            // Priority badge
            ctx.fillStyle = priorityColors[task.priority];
            ctx.fillRect(50, y - 15, 80, 25);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(task.priority.toUpperCase(), 55, y);
            
            // Task text
            ctx.fillStyle = this.darkMode ? '#f1f2f6' : '#2c3e50';
            ctx.font = task.completed ? '16px Arial' : 'bold 16px Arial';
            const text = task.completed ? `✓ ${task.text}` : task.text;
            ctx.fillText(text, 150, y);
            
            // Due date
            if (task.dueDate) {
                ctx.font = '12px Arial';
                ctx.fillStyle = '#666';
                ctx.fillText(`Due: ${new Date(task.dueDate).toLocaleDateString()}`, 150, y + 20);
            }
            
            y += 50;
        });
        
        // Download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `alienweb-todo-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
            URL.revokeObjectURL(url);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const app = new TodoApp();