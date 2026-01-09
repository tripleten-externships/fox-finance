import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const data = [
  {
    id: 1,
    name: "jmik",
    email: "jmik@gmail.com",
    company: "Google",
    status: "Active",
  },
  {
    id: 2,
    name: "John Doe",
    email: "johndoe@gmail.com",
    company: "Microsoft",
    status: "Inactive",
  },
  {
    id: 3,
    name: "Mary",
    email: "Mary@gmail.com",
    company: "Cricket",
    status: "Inactive",
  },
  {
    id: 4,
    name: "Johnathan",
    email: "johnathan@gmail.com",
    company: "House Keeping",
    status: "Active",
  },
];

export default function Clientfilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "All");
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    const timer = setTimeout(() => {
      // 1) Sync URL params
      const params = {};
      if (search) params.search = search;
      if (status !== "All") params.status = status;
      setSearchParams(params, { replace: true });

      // 2) Filter data
      let myData = [...data];

      if (search) {
        const searchData = search.toLowerCase();
        myData = myData.filter(
          (item) =>
            item.name.toLowerCase().includes(searchData) ||
            item.email.toLowerCase().includes(searchData) ||
            item.company.toLowerCase().includes(searchData)
        );
      }

      if (status !== "All") {
        myData = myData.filter((item) => item.status === status);
      }

      setFilteredData(myData);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status, setSearchParams]);

  const hasActiveFilter = search.length > 0 || status !== "All";

return (
  <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg">
    <h2 className="text-2xl font-bold mb-4 text-gray-800">
      Client Filters <span className="text-sm font-normal text-gray-500">(URL State)</span>
    </h2>

    {/* Controls row */}
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <input
        placeholder="Search by Name, Email, Company"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 min-w-[220px] border border-gray-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
      >
        <option value="All">All</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

      {hasActiveFilter && (
        <button
          onClick={() => {
            setSearch("");
            setStatus("All");
            setSearchParams({});
          }}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
        >
          Clear All
        </button>
      )}
    </div>

    {/* Active filter chips */}
    {hasActiveFilter && (
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {search && (
          <FilterChip
            label={`Search: ${search}`}
            onRemove={() => setSearch("")}
          />
        )}
        {status !== "All" && (
          <FilterChip
            label={`Status: ${status}`}
            onRemove={() => setStatus("All")}
          />
        )}
      </div>
    )}

    {/* Results */}
    {filteredData.length === 0 ? (
      <p className="text-gray-500 italic">No data found. Try adjusting your filters.</p>
    ) : (
      <ul className="space-y-2">
        {filteredData.map((item) => (
          <li
            key={item.id}
            className="border border-gray-200 rounded-lg px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-sm"
          >
            <div>
              <p className="font-semibold text-gray-800">{item.name}</p>
              <p className="text-sm text-gray-600">{item.email}</p>
              <p className="text-sm text-gray-500">{item.company}</p>
            </div>
            <span
              className={`mt-2 sm:mt-0 inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                item.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {item.status}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

}
type FilterChipProps = {
  label: string;
  onRemove: () => void;
};

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <div className="inline-flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full mr-3 shadow-md hover:shadow-lg transition-all duration-200">
      <span className="text-sm font-semibold tracking-wide">{label}</span>

      <button
        onClick={onRemove}
        className="ml-3 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center transition-all duration-200"
      >
        ✕
      </button>
    </div>
  );
}
