interface Props {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 15, 20];

export function PageSizeSelector(props: Props) {
  const { pageSize, onPageSizeChange } = props;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(event.target.value, 10);
    onPageSizeChange(newSize);
  };

  return (
    <div className="flex items-baseline gap-2 text-sm text-gray-600 whitespace-nowrap">
      <label htmlFor="page-size-select">Show</label>
      <select
        id="page-size-select"
        value={pageSize}
        onChange={handleChange}
        className="border border-primary-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span>items per page</span>
    </div>
  );
}
