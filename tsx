// ...
<div className="flex items-center gap-4">
  <h2 className="text-lg font-semibold text-white">Deployment Pipeline</h2>
  <Button 
    size="sm" 
    className="h-7 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
    onClick={() => setTaskModal({ open: true, mode: "create" })}
  >
    <Plus className="w-3 h-3 mr-1.5" />
    Add Task
  </Button>
</div>
// ...
