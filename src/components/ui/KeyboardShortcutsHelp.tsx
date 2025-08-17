export default function KeyboardShortcutsHelp() {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">Keyboard Shortcuts</h3>
      <div className="space-y-2 text-xs text-slate-400">
        <div className="flex justify-between">
          <span>Add expense</span>
          <kbd className="px-2 py-1 bg-slate-700 rounded">⌘ N</kbd>
        </div>
        <div className="flex justify-between">
          <span>View expenses</span>
          <kbd className="px-2 py-1 bg-slate-700 rounded">⌘ E</kbd>
        </div>
        <div className="flex justify-between">
          <span>Dashboard</span>
          <kbd className="px-2 py-1 bg-slate-700 rounded">⌘ D</kbd>
        </div>
        <div className="flex justify-between">
          <span>Search</span>
          <kbd className="px-2 py-1 bg-slate-700 rounded">/</kbd>
        </div>
        <div className="flex justify-between">
          <span>Export</span>
          <kbd className="px-2 py-1 bg-slate-700 rounded">⌘ S</kbd>
        </div>
      </div>
    </div>
  );
}