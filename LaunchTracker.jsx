import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { RefreshCw, Calendar } from 'lucide-react';

// Google Sheets CSV URL
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRs3g8n-aiQlJDW-eSVblG-_rbtsUzn8LX0QEj3VofDfmaL9Y56pz8ymedDnVmub-o_2zCOwv827T34/pub?gid=0&single=true&output=csv';

const LaunchTracker = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [syncing, setSyncing] = useState(false);

  // Color mapping based on primary (first) owner
  const ownerColors = {
    'Ryan': 'bg-blue-500',
    'Adam': 'bg-emerald-500',
    'Heidi': 'bg-orange-500',
    'Monica': 'bg-purple-500',
    'Construction': 'bg-amber-500',
    'Design': 'bg-pink-500',
    'All': 'bg-red-500',
    'Milestone': 'bg-red-500'
  };

  const ownerTextColors = {
    'Ryan': 'text-blue-500',
    'Adam': 'text-emerald-500',
    'Heidi': 'text-orange-500',
    'Monica': 'text-purple-500',
    'Construction': 'text-amber-500',
    'Design': 'text-pink-500',
    'All': 'text-red-500',
    'Milestone': 'text-red-500'
  };

  // Status indicators (left-edge stripe + opacity)
  const statusStyles = {
    'Pending': { border: 'border-l-8 border-red-500', opacity: 'opacity-60' },
    'In Progress': { border: 'border-l-8 border-yellow-400', opacity: 'opacity-100' },
    'Done': { border: 'border-l-8 border-green-500', opacity: 'opacity-90' }
  };

  // Timeline configuration (Feb 2026 - September 2026)
  const timelineStart = new Date('2026-02-01');
  const timelineEnd = new Date('2026-09-30');
  const timelineDays = Math.ceil((timelineEnd - timelineStart) / (1000 * 60 * 60 * 24));

  // Fetch and parse CSV data
  const fetchData = async () => {
    setSyncing(true);
    try {
      const response = await fetch(CSV_URL);
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedTasks = results.data.map((row, index) => {
            // Parse Owner column (comma-separated values)
            const ownerString = row.Owner || '';
            const owners = ownerString.split(',').map(o => o.trim()).filter(o => o);
            
            // Primary owner is the first one
            const primaryOwner = owners[0] || 'Unknown';
            
            // Better date parsing for M/D/YYYY format
            const parseDate = (dateStr) => {
              if (!dateStr) return null;
              // Handle M/D/YYYY format
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                const month = parseInt(parts[0]) - 1; // Months are 0-indexed
                const day = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                return new Date(year, month, day);
              }
              return new Date(dateStr);
            };
            
            return {
              id: index,
              taskName: row.Task || row['Task Name'] || 'Unnamed Task',
              owners: owners,
              primaryOwner: primaryOwner,
              startDate: parseDate(row['Start Date']),
              endDate: parseDate(row['End Date']),
              status: row.Status || 'Not Started',
              color: ownerColors[primaryOwner] || 'bg-gray-500'
            };
          }).filter(task => task.startDate && task.endDate && !isNaN(task.startDate.getTime()));
          
          setTasks(parsedTasks);
          setLoading(false);
          setSyncing(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setLoading(false);
          setSyncing(false);
        }
      });
    } catch (error) {
      console.error('Error fetching CSV:', error);
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate position and width for Gantt bars
  const calculateBarStyle = (startDate, endDate) => {
    const start = Math.max(0, Math.ceil((startDate - timelineStart) / (1000 * 60 * 60 * 24)));
    const end = Math.min(timelineDays, Math.ceil((endDate - timelineStart) / (1000 * 60 * 60 * 24)));
    const duration = end - start;
    
    const left = (start / timelineDays) * 100;
    const width = (duration / timelineDays) * 100;
    
    return {
      left: `${left}%`,
      width: `${width}%`
    };
  };

  // Calculate global progress
  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status.toLowerCase() === 'done').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  // Get unique owners for filter dropdown
  const getAllOwners = () => {
    const ownersSet = new Set();
    tasks.forEach(task => {
      task.owners.forEach(owner => ownersSet.add(owner));
    });
    return ['All', ...Array.from(ownersSet).sort()];
  };

  // Status sort order (Pending -> In Progress -> Done)
  const statusOrder = {
    'Pending': 1,
    'In Progress': 2,
    'Done': 3
  };

  // Filter and sort tasks based on selected person and status
  const filteredTasks = (selectedFilter === 'All' 
    ? tasks 
    : tasks.filter(task => task.owners.includes(selectedFilter)))
    .sort((a, b) => {
      const orderA = statusOrder[a.status] || 999;
      const orderB = statusOrder[b.status] || 999;
      return orderA - orderB;
    });

  // Generate month labels for timeline
  const generateMonthLabels = () => {
    const months = [];
    let year = timelineStart.getFullYear();
    let month = timelineStart.getMonth();
    const endYear = timelineEnd.getFullYear();
    const endMonth = timelineEnd.getMonth();
    
    while (year < endYear || (year === endYear && month <= endMonth)) {
      const date = new Date(year, month, 1);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date: date
      });
      
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    
    return months;
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading launch tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">Nourished to Go Launch Tracker</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Filter Dropdown */}
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getAllOwners().map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
              
              {/* Sync Button */}
              <button
                onClick={fetchData}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync'}
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Overall Progress</span>
              <span className="font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {filteredTasks.filter(t => t.status.toLowerCase() === 'done').length} of {filteredTasks.length} tasks completed
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Color Legend (Primary Owner)</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(ownerColors).map(([owner, color]) => (
              <div key={owner} className="flex items-center gap-2">
                <div className={`w-4 h-4 ${color} rounded`}></div>
                <span className="text-sm text-gray-600">{owner}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Note: Colors are based on the <strong>primary (first) owner</strong>. 
            Filtering shows all tasks where the selected person appears in the owner list.
          </p>
          
          {/* Status Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Indicators (Left-Edge Stripe)</h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-12 h-6 bg-blue-200 border-l-8 border-red-500 rounded opacity-60"></div>
                <span className="text-sm text-gray-600">Pending (faded)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-6 bg-blue-200 border-l-8 border-yellow-400 rounded opacity-100"></div>
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-6 bg-blue-200 border-l-8 border-green-500 rounded opacity-90"></div>
                <span className="text-sm text-gray-600">Done</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Pending tasks appear faded to focus attention on active and completed work.
            </p>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Timeline Header */}
          <div className="sticky top-0 z-10 bg-gray-100 border-b border-gray-300">
            <div className="flex">
              <div className="w-64 flex-shrink-0 px-4 py-3 font-semibold text-gray-700 border-r border-gray-300">
                Task Name
              </div>
              <div className="flex-grow relative">
                <div className="flex h-full">
                  {generateMonthLabels().map((month, idx) => (
                    <div 
                      key={idx} 
                      className="flex-1 px-2 py-3 text-center text-sm font-medium text-gray-600 border-r border-gray-200"
                    >
                      {month.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="divide-y divide-gray-200">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                No tasks found for the selected filter.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const barStyle = calculateBarStyle(task.startDate, task.endDate);
                const primaryColor = task.color;
                const primaryOwner = task.primaryOwner;
                const statusStyle = statusStyles[task.status] || { border: 'border-l-8 border-gray-400', opacity: 'opacity-100' };
                
                return (
                  <div key={task.id} className="flex hover:bg-gray-50 transition-colors">
                    {/* Task Name */}
                    <div className="w-64 flex-shrink-0 px-4 py-2 border-r border-gray-200 flex items-center">
                      <div className="font-medium text-gray-900 text-sm">{task.taskName}</div>
                    </div>
                    
                    {/* Gantt Bar */}
                    <div className="flex-grow relative py-2 px-2">
                      <div className="relative h-8">
                        <div
                          className={`absolute h-full ${primaryColor} ${statusStyle.border} ${statusStyle.opacity} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                          style={barStyle}
                        >
                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-20">
                            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                              <div className="font-semibold mb-1">{task.taskName}</div>
                              <div className="text-gray-300">
                                <div>Owners: {task.owners.join(', ')}</div>
                                <div>Start: {task.startDate.toLocaleDateString()}</div>
                                <div>End: {task.endDate.toLocaleDateString()}</div>
                                <div>Status: {task.status}</div>
                              </div>
                              {/* Tooltip Arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                                <div className="border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchTracker;
