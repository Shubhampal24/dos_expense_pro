import {
  FiFileText,
  FiUpload,
  FiDownload,
  FiX,
  FiCheck,
  FiAlertTriangle,
} from "react-icons/fi";

const ExcelImportModal = ({
  showExcelImport,
  resetExcelImport,
  downloadExcelTemplate,
  excelFile,
  handleExcelFileChange,
  isImporting,
  importProgress,
  importPreview,
  importResults,
  processExcelImport,
}) => {
  if (!showExcelImport) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Import Expenses from Excel/CSV
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Bulk import advertising expenses from an Excel or CSV file
            </p>
          </div>
          <button
            onClick={resetExcelImport}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Download Template */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 mb-2">
                  Download Template
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Download the CSV template with the required format for
                  importing locations
                </p>
                <button
                  onClick={downloadExcelTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FiDownload size={16} />
                  Download CSV Template
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Upload Excel File */}
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 mb-2">Upload File</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Select your file with location data (supports .xlsx, .xls, and
                  .csv files)
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FiUpload className="mx-auto text-gray-400 text-3xl mb-2" />
                  <p className="text-gray-600 mb-3">
                    {excelFile
                      ? `Selected: ${excelFile.name}`
                      : "Choose Excel/CSV file or drag and drop"}
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelFileChange}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label
                    htmlFor="excel-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <FiFileText size={16} />
                    Choose File
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Format Guide */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">
              Expected File Format (Excel/CSV):
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 text-zinc-800 px-2 py-1 text-left text-xs">
                      expenseDate
                    </th>
                    <th className="border border-gray-300 text-zinc-800 px-2 py-1 text-left text-xs">
                      paidTo
                    </th>
                    <th className="border border-gray-300 text-zinc-800 px-2 py-1 text-left text-xs">
                      reason
                    </th>
                    <th className="border border-gray-300 text-zinc-800 px-2 py-1 text-left text-xs">
                      amount
                    </th>
                    <th className="border border-gray-300 text-zinc-800 px-2 py-1 text-left text-xs">
                      verified
                    </th>
                    <th className="border border-gray-300 text-zinc-800 px-2 py-1 text-left text-xs">
                      regionName
                    </th>
                    <th className="border border-gray-300 text-zinc-800 px-2 py-1 text-left text-xs">
                      branchName
                    </th>
                    <th className="border border-gray-300 text-zinc-800 px-2 py-1 text-left text-xs">
                      centreName
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 text-zinc-800 px-2 py-1 text-xs">
                      2025-08-06
                    </td>
                    <td className="border border-gray-300 text-zinc-800 px-2 py-1 text-xs">
                      Google Ads
                    </td>
                    <td className="border border-gray-300 text-zinc-800 px-2 py-1 text-xs">
                      -
                    </td>
                    <td className="border border-gray-300 text-zinc-800 px-2 py-1 text-xs">
                      20000
                    </td>
                    <td className="border border-gray-300 text-zinc-800 px-2 py-1 text-xs">
                      false
                    </td>
                    <td className="border border-gray-300 text-zinc-800 px-2 py-1 text-xs">
                      West
                    </td>
                    <td className="border border-gray-300 text-zinc-800 px-2 py-1 text-xs">
                      Pune
                    </td>
                    <td className="border border-gray-300 text-zinc-800 px-2 py-1 text-xs">
                      Hinjewadi
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <p>
                <strong>Required:</strong> expenseDate, paidTo, amount, regionName, branchName, centreName
              </p>
              <p>
                <strong>Optional:</strong> reason, verified (defaults to false)
              </p>
              <p>
                <strong>Formats:</strong> .xlsx, .xls, .csv
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {isImporting && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="font-medium text-gray-800">
                  Processing Import...
                </h3>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {importProgress}% complete
              </p>
            </div>
          )}

          {/* Preview Data */}
          {importPreview.length > 0 && !isImporting && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <h3 className="font-medium text-gray-800">
                  Preview Import Data
                </h3>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  {importPreview.length} entries
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto border border-zinc-300 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left text-zinc-800 border-b font-medium text-xs">
                        Date
                      </th>
                      <th className="px-2 py-2 text-left text-zinc-800 border-b font-medium text-xs">
                        Paid To
                      </th>
                      <th className="px-2 py-2 text-left text-zinc-800 border-b font-medium text-xs">
                        Amount
                      </th>
                      <th className="px-2 py-2 text-left text-zinc-800 border-b font-medium text-xs">
                        Verified
                      </th>
                      <th className="px-2 py-2 text-left text-zinc-800 border-b font-medium text-xs">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-2 py-2 border-b text-xs text-zinc-800">
                          {row.expenseDate || "N/A"}
                        </td>
                        <td className="px-2 py-2 border-b text-xs text-zinc-800">
                          {row.paidTo || "N/A"}
                        </td>
                        <td className="px-2 py-2 border-b text-xs text-zinc-800 font-medium">
                          ₹{row.amount || "0"}
                        </td>
                        <td className="px-2 py-2 border-b text-xs text-zinc-800">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${row.verified === 'true' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {row.verified === 'true' ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-2 py-2 border-b text-xs text-zinc-800">
                          {row.regionName} / {row.branchName} / {row.centreName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div
              className={`rounded-lg p-4 ${
                importResults.success ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {importResults.success ? (
                  <FiCheck className="text-green-500 text-xl" />
                ) : (
                  <FiAlertTriangle className="text-red-500 text-xl" />
                )}
                <h3
                  className={`font-medium ${
                    importResults.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {importResults.success ? "Import Successful!" : "Import Failed"}
                </h3>
              </div>
              <p
                className={`text-sm ${
                  importResults.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {importResults.summary}
              </p>
              {importResults.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-700 mb-1">
                    Errors:
                  </p>
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {importResults.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={resetExcelImport}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isImporting}
            >
              Cancel
            </button>
            {importPreview.length > 0 && !importResults && (
              <button
                type="button"
                onClick={processExcelImport}
                disabled={isImporting}
                className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiUpload size={16} />
                    Import {importPreview.length} Entries
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelImportModal;
