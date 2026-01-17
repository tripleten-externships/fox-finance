import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 5;

const dummy_data = [
  {
    id: "1",
    client: "Acme Corporation",
    token: "acme-9f3k2a",
    expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: "ACTIVE",
    uploadCount: 4,
  },
  {
    id: "2",
    client: "Blue Ocean LLC",
    token: "blue-7x2m9p",
    expiresAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: "EXPIRED",
    uploadCount: 1,
  },
  {
    id: "3",
    client: "NextGen Solutions",
    token: "next-3k9d1q",
    expiresAt: new Date(Date.now() + 6 * 86400000).toISOString(),
    status: "ACTIVE",
    uploadCount: 7,
  },
  {
    id: "4",
    client: "Vertex Industries",
    token: "vert-8m2x9a",
    expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: "INACTIVE",
    uploadCount: 12,
  },
  {
    id: "5",
    client: "Summit Group",
    token: "summ-4p9z1x",
    expiresAt: new Date(Date.now() + 1 * 86400000).toISOString(),
    status: "ACTIVE",
    uploadCount: 2,
  },
  {
    id: "6",
    client: "Nova Financial",
    token: "nova-0x9k2m",
    expiresAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "EXPIRED",
    uploadCount: 18,
  },
  {
    id: "7",
    client: "Pioneer Tech",
    token: "pio-5z1k9a",
    expiresAt: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: "INACTIVE",
    uploadCount: 6,
  },
  {
    id: "8",
    client: "Atlas Holdings",
    token: "atl-2m9x8q",
    expiresAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    status: "EXPIRED",
    uploadCount: 3,
  },
  {
    id: "9",
    client: "GreenField Partners",
    token: "green-1x9m2k",
    expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    status: "ACTIVE",
    uploadCount: 5,
  },
  {
    id: "10",
    client: "Apple Tree Consulting",
    token: "apple-8k9x2m",
    expiresAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    status: "ACTIVE",
    uploadCount: 9,
  },
];

export default function LinkTable(){
  const [page, setPage] = useState(1);
 const [list,setList]=useState<any[]>([]);
  const [filter, setFilter] = useState({
    client: "",
    status: "",
    expiration: "",
  });

  // Store selected IDs
  const [selectedList,setSelectedList]=useState<Set<string>>(new Set())
  const filteredData = useMemo(() => {
    let data = [...list];

    if (filter.client) {
      const q = filter.client.toLowerCase();
      data = data.filter((item) => item.client.toLowerCase().includes(q));
    }

    if (filter.status) {
      data = data.filter((item) => item.status === filter.status);
    }

    if (filter.expiration === "soon") {
      data = data.filter(
        (item) => new Date(item.expiresAt).getTime() - Date.now() < 24 * 3600000
      );
    }

    if (filter.expiration === "expired") {
      data = data.filter((item) => new Date(item.expiresAt) < new Date());
    }

    if (filter.expiration === "valid") {
      data = data.filter((item) => new Date(item.expiresAt) > new Date());
    }

    data.sort(
      (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    );

    return data;
  }, [filter, list]);

  // bulk Selection 
  const toggleSelectedId = (id: string) => {
  setSelectedList((prev) => {
    const copy = new Set(prev);
    copy.has(id) ? copy.delete(id) : copy.add(id);
    return copy;
  });
};


  const bulkDeactivate = () => {
    setList((currentRow) =>
      currentRow.map((obj) =>
        selectedList.has(obj.id) ? { ...obj, status: "INACTIVE" } : obj
      )
    );
    setSelectedList(new Set<string>());
  };

  const paginatedData = filteredData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const isFirstPage = page === 1;
  const isLastPage = page * PAGE_SIZE >= filteredData.length;

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => (isLastPage ? p : p + 1));

  useEffect(() => {
    setList(dummy_data);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter.client, filter.status, filter.expiration]);

  return (
    <div>
      <div className="p-6 bg-white rounded-xl shadow-sm space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Upload Link Lists
        </h3>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Client Info"
            value={filter.client}
            onChange={(e) =>
              setFilter({ ...filter, client: e.target.value })
            }
          />

          <select
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter.status}
            onChange={(e) =>
              setFilter({
                ...filter,
                status: e.target.value,
              })
            }
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            className="w-full sm:w-52 px-3 py-2 border border-gray-300 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter.expiration}
            onChange={(e) =>
              setFilter({
                ...filter,
                expiration: e.target.value,
              })
            }
          >
            <option value="">All Expiration</option>
            <option value="soon">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="valid">Valid</option>
          </select>
        </div>

        {selectedList.size > 0 && (
          <button
            onClick={bulkDeactivate}
            className="inline-flex items-center px-4 py-2
                 bg-red-600 text-white font-medium rounded-lg
                 hover:bg-red-700 transition"
            type="button"
          >
            Deactivate Selected ({selectedList.size})
          </button>
        )}
      </div>

      <table className="w-full border border-gray-300 border-collapse text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 border-b border-gray-300 text-left"></th>
            <th className="px-3 py-2 border-b border-gray-300 text-left">
              Client
            </th>
            <th className="px-3 py-2 border-b border-gray-300 text-left">
              Token
            </th>
            <th className="px-3 py-2 border-b border-gray-300 text-left">
              Expires
            </th>
            <th className="px-3 py-2 border-b border-gray-300 text-left">
              Status
            </th>
            <th className="px-3 py-2 border-b border-gray-300 text-left">
              Uploads
            </th>
          </tr>
        </thead>

        <tbody>
          {paginatedData.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedList.has(item.id)}
                  onChange={() => toggleSelectedId(item.id)}
                />
              </td>

              <td className="px-3 py-2 border-b border-gray-200">
                {item.client}
              </td>
              <td className="px-3 py-2 border-b border-gray-200 font-mono">
                {item.token}
              </td>
              <td className="px-3 py-2 border-b border-gray-200 font-mono">
                {item.expiresAt}
              </td>
              <td className="px-3 py-2 border-b border-gray-200 font-semibold">
                {item.status}
              </td>
              <td className="px-3 py-2 border-b border-gray-200">
                {item.uploadCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 flex items-center gap-2">
        <button
          disabled={isFirstPage}
          onClick={handlePrev}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          Prev
        </button>

        <span className="px-3 py-1 text-sm font-semibold text-gray-700">
          Page {page}
        </span>

        <button
          disabled={isLastPage}
          onClick={handleNext}
          className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
