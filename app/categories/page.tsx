import { CategoriesGrid } from "@/components/categories-grid"

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Categories</h1>
        <p className="text-gray-600 mt-2">Manage and configure email classification categories</p>
      </div>

      <CategoriesGrid />
    </div>
  )
}
