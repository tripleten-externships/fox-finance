export function QuickActions({ id: _id}: { id: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <button className="text-blue-600">Edit</button>
      <button className="text-red-600">Delete</button>
      <button className="text-purple-600">Create Link</button>
    </div>
  );
}