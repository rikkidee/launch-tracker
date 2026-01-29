# Nourished to Go Launch Tracker

A beautiful, interactive Gantt chart component for tracking the Nourished to Go project launch with smart filtering and real-time CSV sync.

## Features

- **CSV Data Parsing**: Fetches and parses data from Google Sheets CSV export
- **Multi-Owner Support**: Handles comma-separated owner lists
- **Color-Coded Tasks**: Primary (first) owner determines task color
- **Smart Filtering**: Filter by any owner (shows tasks where person is primary OR secondary)
- **Timeline Visualization**: Feb 2026 - April 2026 timeline view
- **Progress Tracking**: Sticky header with overall completion percentage
- **Real-Time Sync**: Refresh button to re-fetch data without page reload
- **Interactive Tooltips**: Hover over bars to see full task details

## Installation

```bash
npm install
```

## Setup

1. **Update the CSV URL**: Open `LaunchTracker.jsx` and replace the placeholder CSV_URL:

```javascript
const CSV_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv';
```

To get your Google Sheets CSV URL:
- Open your Google Sheet
- Click File → Share → Publish to web
- Choose "Comma-separated values (.csv)" and the specific sheet
- Copy the URL

2. **CSV Format**: Your CSV should have these columns:
   - `Task` or `Task Name`: Name of the task
   - `Owner`: Comma-separated owners (e.g., "Heidi, Adam" or "Construction, Owner")
   - `Start Date`: Task start date (format: YYYY-MM-DD or MM/DD/YYYY)
   - `End Date`: Task end date
   - `Status`: Task status (use "Done" for completed tasks)

## Usage

### Development

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

### In Your React App

```jsx
import LaunchTracker from './LaunchTracker';

function App() {
  return <LaunchTracker />;
}
```

## Color Legend

Colors are assigned based on the **first person** listed in the Owner column:

- **Owner**: Blue
- **Adam**: Emerald
- **Heidi**: Orange
- **Monica**: Purple
- **Construction**: Amber
- **Design**: Pink
- **All/Milestone**: Red
- **Unknown**: Gray (fallback)

## Smart Filtering Example

If you have a task with `Owner: "Heidi, Adam"`:
- The bar will be **orange** (Heidi is primary)
- When you filter by "Adam", the task will still appear
- The color remains **orange** (maintains primary owner color)

This ensures you can find all tasks a person is involved in while maintaining visual consistency.

## Customization

### Add More Owners

Edit the `ownerColors` object in `LaunchTracker.jsx`:

```javascript
const ownerColors = {
  'Owner': 'bg-blue-500',
  'YourName': 'bg-indigo-500', // Add your custom color
  // ... other owners
};
```

### Change Timeline Range

Modify the timeline dates:

```javascript
const timelineStart = new Date('2026-02-01');
const timelineEnd = new Date('2026-04-30');
```

## Technologies

- React 18
- Tailwind CSS
- PapaParse (CSV parsing)
- Lucide React (icons)
- Vite (build tool)
