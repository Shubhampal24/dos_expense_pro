import { FiAlertTriangle } from "react-icons/fi";

const DeleteConfirmModal = ({
  showDeleteConfirm,
  expenseToDelete,
  setShowDeleteConfirm,
  setExpenseToDelete,
  isLoading,
  confirmDeleteExpense,
}) => {
  if (!showDeleteConfirm || !expenseToDelete) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <FiAlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Delete Expense</h3>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete this expense? This action cannot be
            undone.
          </p>
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-900">
              Paid To: {expenseToDelete.paidTo}
            </p>
            <p className="text-sm text-gray-600">
              Amount: ₹{expenseToDelete.amount?.toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-gray-600">
              Date:{" "}
              {new Date(expenseToDelete.expenseDate).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowDeleteConfirm(false);
              setExpenseToDelete(null);
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteExpense}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
