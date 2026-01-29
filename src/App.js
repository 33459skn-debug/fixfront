import React, { useState, useEffect } from 'react';
import { Plus, Inbox, Calendar, CheckCircle2, Circle, Trash2, Menu, X, Flag, CalendarDays, ArrowUpDown, LogOut, User } from 'lucide-react';
import { authAPI, tasksAPI } from './api';

export default function TodoistClone() {
// Auth state
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [user, setUser] = useState(null);
const [authMode, setAuthMode] = useState('login'); // ‘login’ or ‘signup’
const [authEmail, setAuthEmail] = useState(’’);
const [authPassword, setAuthPassword] = useState(’’);
const [authName, setAuthName] = useState(’’);
const [authError, setAuthError] = useState(’’);
const [authLoading, setAuthLoading] = useState(false);

// Task state
const [tasks, setTasks] = useState([]);
const [inputValue, setInputValue] = useState(’’);
const [selectedView, setSelectedView] = useState(‘inbox’);
const [sidebarOpen, setSidebarOpen] = useState(typeof window !== ‘undefined’ ? window.innerWidth >= 768 : true);
const [showAddTask, setShowAddTask] = useState(false);
const [taskPriority, setTaskPriority] = useState(‘none’);
const [taskDeadline, setTaskDeadline] = useState({ day: ‘’, month: ‘’, year: ‘’ });
const [showPriorityMenu, setShowPriorityMenu] = useState(false);
const [sortBy, setSortBy] = useState(‘default’);
const [showSortMenu, setShowSortMenu] = useState(false);
const [loading, setLoading] = useState(true);

// Check if user is logged in on mount
useEffect(() => {
const checkAuth = async () => {
if (authAPI.isLoggedIn()) {
try {
const data = await authAPI.getMe();
setUser(data.user);
setIsAuthenticated(true);
} catch (error) {
authAPI.logout();
}
}
setLoading(false);
};
checkAuth();
}, []);

// Load tasks when authenticated
useEffect(() => {
const loadTasks = async () => {
if (isAuthenticated) {
try {
const fetchedTasks = await tasksAPI.getAll();
setTasks(fetchedTasks);
} catch (error) {
console.error(‘Failed to load tasks:’, error);
}
}
};
loadTasks();
}, [isAuthenticated]);

// Handle login
const handleLogin = async (e) => {
e.preventDefault();
setAuthError(’’);
setAuthLoading(true);
try {
const data = await authAPI.login(authEmail, authPassword);
setUser(data.user);
setIsAuthenticated(true);
setAuthEmail(’’);
setAuthPassword(’’);
} catch (error) {
setAuthError(error.message);
}
setAuthLoading(false);
};

// Handle signup
const handleSignup = async (e) => {
e.preventDefault();
setAuthError(’’);
setAuthLoading(true);
try {
const data = await authAPI.signup(authEmail, authPassword, authName);
setUser(data.user);
setIsAuthenticated(true);
setAuthEmail(’’);
setAuthPassword(’’);
setAuthName(’’);
} catch (error) {
setAuthError(error.message);
}
setAuthLoading(false);
};

// Handle logout
const handleLogout = () => {
authAPI.logout();
setIsAuthenticated(false);
setUser(null);
setTasks([]);
};

const formatDeadline = (deadlineObj) => {
if (!deadlineObj || !deadlineObj.day || !deadlineObj.month || !deadlineObj.year) {
return null;
}

```
const day = deadlineObj.day.padStart(2, '0');
const month = deadlineObj.month.padStart(2, '0');
const year = deadlineObj.year;

if (year.length !== 4) return null;

const date = new Date(`${year}-${month}-${day}`);
if (isNaN(date.getTime())) return null;

return date.toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});
```

};

const addTask = async () => {
if (!inputValue.trim()) return;

```
const formattedDate = formatDeadline(taskDeadline);

const newTaskData = {
  text: inputValue,
  priority: taskPriority,
  deadline: taskDeadline,
  formattedDeadline: formattedDate,
  view: selectedView
};

try {
  // Get the newly created task from the API response
  const createdTask = await tasksAPI.create(newTaskData);
  
  // Immediately add it to the local state (optimistic update)
  setTasks(prevTasks => [...prevTasks, createdTask]);
  
  // Reset form
  setInputValue('');
  setTaskPriority('none');
  setTaskDeadline({ day: '', month: '', year: '' });
  setShowAddTask(false);
} catch (error) {
  console.error('Failed to add task:', error);
  // Optionally refetch all tasks if there's an error
  try {
    const updatedTasks = await tasksAPI.getAll();
    setTasks(updatedTasks);
  } catch (refetchError) {
    console.error('Failed to refetch tasks:', refetchError);
  }
}
```

};

const handleKeyPress = (e) => {
if (e.key === ‘Enter’) {
addTask();
}
};

const toggleTask = async (id) => {
const task = tasks.find(t => t.id === id);
if (!task) return;

```
try {
  const updatedTask = await tasksAPI.update(id, { completed: !task.completed });
  setTasks(tasks.map(t => t.id === id ? updatedTask : t));
} catch (error) {
  console.error('Failed to toggle task:', error);
}
```

};

const deleteTask = async (id) => {
try {
await tasksAPI.delete(id);
setTasks(tasks.filter(t => t.id !== id));
} catch (error) {
console.error(‘Failed to delete task:’, error);
}
};

const filteredTasks = tasks.filter(t => {
if (selectedView === ‘today’) {
const today = new Date().toDateString();
return new Date(t.date).toDateString() === today;
}
return t.view === selectedView;
});

const sortedTasks = […filteredTasks].sort((a, b) => {
if (sortBy === ‘priority’) {
const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
return priorityOrder[a.priority] - priorityOrder[b.priority];
} else if (sortBy === ‘deadline’) {
if (!a.formattedDeadline && !b.formattedDeadline) return 0;
if (!a.formattedDeadline) return 1;
if (!b.formattedDeadline) return -1;

```
  const dateA = new Date(a.deadline.year, a.deadline.month - 1, a.deadline.day);
  const dateB = new Date(b.deadline.year, b.deadline.month - 1, b.deadline.day);
  return dateA - dateB;
}
return 0;
```

});

const completedCount = tasks.filter(t => t.completed).length;

const views = [
{ id: ‘inbox’, icon: Inbox, label: ‘Inbox’, count: tasks.filter(t => t.view === ‘inbox’).length },
{
id: ‘today’, icon: Calendar, label: ‘Today’, count: tasks.filter(t => {
const today = new Date().toDateString();
return new Date(t.date).toDateString() === today;
}).length
},
{ id: ‘upcoming’, icon: Calendar, label: ‘Upcoming’, count: tasks.filter(t => t.view === ‘upcoming’).length }
];

const priorities = [
{ id: ‘none’, label: ‘No Priority’, color: ‘text-neutral-500’, bg: ‘bg-neutral-100’, hover: ‘hover:bg-neutral-200’, border: ‘border-neutral-300’ },
{ id: ‘low’, label: ‘Priority 1’, color: ‘text-blue-600’, bg: ‘bg-blue-50’, hover: ‘hover:bg-blue-100’, border: ‘border-blue-400’ },
{ id: ‘medium’, label: ‘Priority 2’, color: ‘text-yellow-600’, bg: ‘bg-yellow-50’, hover: ‘hover:bg-yellow-100’, border: ‘border-yellow-400’ },
{ id: ‘high’, label: ‘Priority 3’, color: ‘text-red-600’, bg: ‘bg-red-50’, hover: ‘hover:bg-red-100’, border: ‘border-red-400’ }
];

const priorityColors = {
none: ‘text-neutral-500’,
low: ‘text-blue-600’,
medium: ‘text-yellow-600’,
high: ‘text-red-600’
};

const priorityBgColors = {
none: ‘bg-neutral-50’,
low: ‘bg-blue-50’,
medium: ‘bg-yellow-50’,
high: ‘bg-red-50’
};

const getCurrentPriority = () => {
return priorities.find(p => p.id === taskPriority);
};

// Loading screen
if (loading) {
return (
<div className="flex h-screen items-center justify-center bg-neutral-50">
<div className="text-center">
<CheckCircle2 className="mx-auto text-red-600 animate-pulse" size={48} />
<p className="mt-4 text-neutral-600">Loading…</p>
</div>
</div>
);
}

// Auth screen
if (!isAuthenticated) {
return (
<div className="flex h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-red-50">
<div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl">
<div className="flex items-center justify-center gap-2 mb-8">
<CheckCircle2 className="text-red-600" size={36} />
<span className="text-2xl font-bold text-neutral-900">Todoist</span>
</div>

```
      <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
        <button
          onClick={() => { setAuthMode('login'); setAuthError(''); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${authMode === 'login' ? 'bg-white text-neutral-900 shadow' : 'text-neutral-600'
            }`}
        >
          Login
        </button>
        <button
          onClick={() => { setAuthMode('signup'); setAuthError(''); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${authMode === 'signup' ? 'bg-white text-neutral-900 shadow' : 'text-neutral-600'
            }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
        {authMode === 'signup' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
            <input
              type="text"
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg border-2 border-neutral-200 focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
          <input
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 rounded-lg border-2 border-neutral-200 focus:border-red-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
          <input
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border-2 border-neutral-200 focus:border-red-500 focus:outline-none transition-colors"
          />
          {authMode === 'signup' && (
            <p className="text-xs text-neutral-500 mt-1">At least 6 characters</p>
          )}
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {authError}
          </div>
        )}

        <button
          type="submit"
          disabled={authLoading}
          className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Create Account')}
        </button>
      </form>
    </div>
  </div>
);
```

}

return (
<div className="flex h-screen bg-neutral-50 text-neutral-900">
{/* Mobile Overlay */}
{sidebarOpen && (
<div
className=“fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden”
onClick={() => setSidebarOpen(false)}
/>
)}
{/* Sidebar */}
<div className={`${sidebarOpen ? 'w-72' : 'w-0'} fixed md:relative z-40 h-full transition-all duration-300 bg-amber-50 border-r border-amber-200 overflow-hidden flex flex-col`}>
<div className="p-6">
<div className="flex items-center gap-2 mb-8">
<CheckCircle2 className="text-red-600" size={28} />
<span className="text-xl font-bold text-neutral-900">Todoist</span>
</div>

```
      {/* User info */}
      <div className="flex items-center gap-3 mb-6 p-3 bg-amber-100 rounded-lg">
        <div className="p-2 bg-amber-200 rounded-full">
          <User size={18} className="text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">{user?.name || user?.email}</p>
          <p className="text-xs text-neutral-600 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-amber-200 rounded-md transition-colors"
          title="Logout"
        >
          <LogOut size={18} className="text-neutral-600" />
        </button>
      </div>

      <nav className="space-y-1">
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${selectedView === view.id
              ? 'bg-amber-200 text-neutral-900'
              : 'hover:bg-amber-100 text-neutral-700'
              }`}
          >
            <view.icon size={20} />
            <span className="flex-1 text-left font-medium">{view.label}</span>
            {view.count > 0 && (
              <span className="text-xs bg-neutral-200 px-2 py-0.5 rounded-full">
                {view.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>

    <div className="mt-auto p-6 border-t border-amber-200">
      <div className="text-sm text-neutral-600">
        <div className="flex justify-between mb-1">
          <span>Progress</span>
          <span className="font-medium">{completedCount} / {tasks.length}</span>
        </div>
        <div className="w-full bg-amber-200 rounded-full h-2 mt-2">
          <div
            className="bg-red-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  </div>

  {/* Main Content */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Header */}
    <header className="bg-white border-b border-neutral-200 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-neutral-100 rounded-md transition-colors"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="text-xl md:text-2xl font-bold capitalize">{selectedView}</h1>
      </div>

      {/* Sort Button */}
      <div className="relative">
        <button
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
        >
          <ArrowUpDown size={18} className="text-neutral-600" />
          <span className="text-sm font-medium text-neutral-700">
            Sort: {sortBy === 'default' ? 'Default' : sortBy === 'priority' ? 'Priority' : 'Deadline'}
          </span>
        </button>

        {/* Sort Dropdown */}
        {showSortMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border-2 border-neutral-200 overflow-hidden z-10 animate-[fadeIn_0.2s_ease-out]">
            <button
              onClick={() => {
                setSortBy('default');
                setShowSortMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-100 ${sortBy === 'default' ? 'bg-neutral-50' : 'bg-white'
                }`}
            >
              <span className="text-sm font-medium text-neutral-700">Default</span>
              {sortBy === 'default' && (
                <CheckCircle2 size={16} className="ml-auto text-neutral-600" />
              )}
            </button>
            <button
              onClick={() => {
                setSortBy('priority');
                setShowSortMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-100 ${sortBy === 'priority' ? 'bg-neutral-50' : 'bg-white'
                }`}
            >
              <Flag size={16} className="text-red-600" />
              <span className="text-sm font-medium text-neutral-700">Sort by Priority</span>
              {sortBy === 'priority' && (
                <CheckCircle2 size={16} className="ml-auto text-neutral-600" />
              )}
            </button>
            <button
              onClick={() => {
                setSortBy('deadline');
                setShowSortMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-100 ${sortBy === 'deadline' ? 'bg-neutral-50' : 'bg-white'
                }`}
            >
              <CalendarDays size={16} className="text-green-600" />
              <span className="text-sm font-medium text-neutral-700">Sort by Deadline</span>
              {sortBy === 'deadline' && (
                <CheckCircle2 size={16} className="ml-auto text-neutral-600" />
              )}
            </button>
          </div>
        )}
      </div>
    </header>

    {/* Task List */}
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">
      <div className="max-w-3xl mx-auto">
        {/* Add Task Button */}
        {!showAddTask ? (
          <button
            onClick={() => setShowAddTask(true)}
            className="mb-8 flex items-center gap-2 text-neutral-600 hover:text-red-600 transition-colors group"
          >
            <div className="p-1 rounded-full group-hover:bg-red-100 transition-colors">
              <Plus size={20} />
            </div>
            <span className="font-medium">Add task</span>
          </button>
        ) : (
          <div className="mb-8 bg-white border-2 border-red-500 rounded-xl shadow-2xl p-5 animate-[slideDown_0.3s_ease-out]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Task name"
              autoFocus
              className="w-full outline-none text-neutral-900 placeholder-neutral-400 mb-4 text-lg font-medium"
            />

            {/* Priority and Deadline Row */}
            <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-neutral-200">
              {/* Deadline Input */}
              <div className="flex items-center gap-2 flex-wrap">
                <CalendarDays size={18} className="text-green-600 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={taskDeadline.day || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                        setTaskDeadline({ ...taskDeadline, day: value });
                      }
                    }}
                    placeholder="DD"
                    maxLength="2"
                    className="w-12 px-2 py-2 text-sm text-center text-neutral-700 outline-none bg-white border-2 border-neutral-300 rounded-lg focus:border-green-500 transition-colors"
                  />
                  <span className="text-neutral-400">/</span>
                  <input
                    type="text"
                    value={taskDeadline.month || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                        setTaskDeadline({ ...taskDeadline, month: value });
                      }
                    }}
                    placeholder="MM"
                    maxLength="2"
                    className="w-12 px-2 py-2 text-sm text-center text-neutral-700 outline-none bg-white border-2 border-neutral-300 rounded-lg focus:border-green-500 transition-colors"
                  />
                  <span className="text-neutral-400">/</span>
                  <input
                    type="text"
                    value={taskDeadline.year || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setTaskDeadline({ ...taskDeadline, year: value });
                      }
                    }}
                    placeholder="YYYY"
                    maxLength="4"
                    className="w-16 px-2 py-2 text-sm text-center text-neutral-700 outline-none bg-white border-2 border-neutral-300 rounded-lg focus:border-green-500 transition-colors"
                  />
                </div>
              </div>

              {/* Priority Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border-2 ${getCurrentPriority().bg
                    } ${getCurrentPriority().border} ${getCurrentPriority().hover}`}
                >
                  <Flag size={18} className={getCurrentPriority().color} />
                  <span className={`text-sm font-medium ${getCurrentPriority().color}`}>
                    {getCurrentPriority().label}
                  </span>
                </button>

                {/* Priority Dropdown Menu */}
                {showPriorityMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border-2 border-neutral-200 overflow-hidden z-10 animate-[fadeIn_0.2s_ease-out]">
                    {priorities.map((priority) => (
                      <button
                        key={priority.id}
                        onClick={() => {
                          setTaskPriority(priority.id);
                          setShowPriorityMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${priority.hover
                          } ${taskPriority === priority.id ? priority.bg : 'bg-white'}`}
                      >
                        <Flag size={18} className={priority.color} />
                        <span className={`text-sm font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                        {taskPriority === priority.id && (
                          <CheckCircle2 size={16} className={`ml-auto ${priority.color}`} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={addTask}
                disabled={!inputValue.trim()}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                Add task
              </button>
              <button
                onClick={() => {
                  setShowAddTask(false);
                  setInputValue('');
                  setTaskPriority('none');
                  setTaskDeadline({ day: '', month: '', year: '' });
                  setShowPriorityMenu(false);
                }}
                className="px-5 py-2.5 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="space-y-2">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <CheckCircle2 size={32} className="text-amber-600" />
              </div>
              <p className="text-neutral-500 text-lg">No tasks yet</p>
              <p className="text-neutral-400 text-sm mt-1">Add a task to get started</p>
            </div>
          ) : (
            sortedTasks.map(task => (
              <div
                key={task.id}
                className="group flex items-start gap-3 bg-white border border-neutral-200 rounded-lg px-4 py-3 hover:border-neutral-300 transition-all hover:shadow-sm"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-0.5 flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 size={20} className="text-green-600" />
                  ) : (
                    <Circle size={20} className="text-neutral-400 hover:text-red-600 transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`${task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                    {task.text}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {task.formattedDeadline && (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded-md">
                        <CalendarDays size={12} />
                        {task.formattedDeadline}
                      </span>
                    )}
                    {task.priority !== 'none' && (
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${priorityBgColors[task.priority]} ${priorityColors[task.priority]}`}>
                        <Flag size={12} />
                        {priorities.find(p => p.id === task.priority)?.label}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400">
                      {new Date(task.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-600 flex-shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </div>
</div>
```

);
}
