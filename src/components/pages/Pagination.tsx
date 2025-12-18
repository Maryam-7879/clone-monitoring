import React from 'react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (pageSize: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  startIndex,
  endIndex,
  onPageChange,
  onItemsPerPageChange,
}) => {
  if (totalItems === 0) return null;

  // تعداد صفحات که نمایش می‌دهیم (حداکثر 5)
  const visiblePages = Math.min(5, totalPages);
  const pages: number[] = [];

  // ساده: از 1 تا visiblePages
  for (let i = 1; i <= visiblePages; i++) {
    pages.push(i);
  }

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
      {/* موبایل */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          قبلی
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="mr-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          بعدی
        </button>
      </div>

      {/* دسکتاپ */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <p className="text-sm text-slate-700">
            نمایش{' '}
            <span className="font-medium">{startIndex}</span>{' '}
            تا{' '}
            <span className="font-medium">{endIndex}</span>{' '}
            از{' '}
            <span className="font-medium">{totalItems}</span>{' '}
            مورد
          </p>

          {/* انتخاب تعداد در صفحه */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-sm text-slate-600">در هر صفحه:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value, 10))}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              قبلی
            </button>

            {pages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              بعدی
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
