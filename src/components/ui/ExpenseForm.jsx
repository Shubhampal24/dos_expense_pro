import {
  FiFileText,
  FiSave,
  FiUser,
  FiX,
} from "react-icons/fi";
import Select from "react-select";
import CustomDatePicker from "../CustomDatePicker";
import LocationSelector from "./LocationSelector";
import SelectedLocationsDisplay from "./SelectedLocationsDisplay";

const ExpenseForm = ({
  formData,
  setFormData,
  isLoading,
  isDataLoading,
  isEditMode,
  handleInputChange,
  handleSubmit,
  handleCancelEdit,
  bankAccounts,
  isLoadingBanks,
  centres,
  filteredBranches,
  filteredCentres,
  currentUser,
  accessDeniedEntries,
  setShowAccessDeniedModal
}) => {
  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 w-full max-w-full min-h-full flex flex-col ${isEditMode
        ? 'p-4 border-2 border-blue-300 rounded-lg bg-gradient-to-br from-blue-50 to-white'
        : ''
        }`}
    >
      {/* Date, Paid To, Amount - One Line */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6 xl:gap-8 w-full">
        {/* Expense Date */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Date *
          </label>
          <div className="mt-1">
            <CustomDatePicker
              value={formData.expenseDate}
              onChange={(value) => setFormData(prev => ({ ...prev, expenseDate: value }))}
              placeholder="Select expense date"
              disabled={isLoading}
              className="text-black"
            />
          </div>
        </div>

        {/* Paid To */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Paid To *
          </label>
          <div className="relative mt-1">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <select
              name="paidTo"
              value={formData.paidTo}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select source</option>
              <option value="social media">Social Media</option>
              <option value="website">Website</option>
              <option value="you tube">YouTube</option>
              <option value="sms">SMS</option>
              <option value="justdial">Justdial</option>
              <option value="Google ads">Google Ads</option>
              <option value="meta ads">Meta Ads</option>
              <option value="Double Tick Api">Double Tick Api</option>
              <option value="influencer">Influencer</option>
              <option value="Spa Jobs">Spa Jobs</option>
              <option value="spa advisor">Spa Advisor</option>
            </select>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Amount (₹) *
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
              ₹
            </span>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          {/* Preset Amount Buttons */}
          <div className="mt-2 flex flex-wrap gap-1">
            {[500, 1000, 2500, 5000, 10000, 20000, 25000, 50000].map(
              (amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      amount: amount.toString(),
                    }))
                  }
                  className="px-2 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100 transition-colors"
                  disabled={isLoading}
                >
                  ₹{amount.toLocaleString("en-IN")}
                </button>
              )
            )}
          </div>
          {formData.amount && (
            <p className="text-xs text-gray-500 mt-1">
              ₹
              {parseFloat(formData.amount || 0).toLocaleString(
                "en-IN",
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              )}
            </p>
          )}
        </div>
      </div>

      {/* Bank Account Field */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 gap-4 lg:gap-6 xl:gap-8 w-full">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Bank Account
          </label>
          <div className="relative mt-1">
            <Select
              isLoading={isLoadingBanks}
              isDisabled={isLoadingBanks}
              options={bankAccounts.map((account) => ({
                value: account.id,
                label: `${account.accountHolder} - ${account.bankName
                  } (****${account.accountNumber.slice(-4)})`,
                account: account,
              }))}
              value={
                bankAccounts
                  .map((account) => ({
                    value: account.id,
                    label: `${account.accountHolder} - ${account.bankName
                      } (****${account.accountNumber.slice(-4)})`,
                    account: account,
                  }))
                  .find(
                    (option) => option.value === formData.bankAccount
                  ) || null
              }
              onChange={(selected) => {
                setFormData((prev) => ({
                  ...prev,
                  bankAccount: selected ? selected.value : "",
                }));
              }}
              placeholder="Select a bank account"
              classNamePrefix="react-select"
              isClearable={true}
              isSearchable={true}
              formatOptionLabel={(option) => (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {option.account.accountHolder}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      {option.account.bankName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Account: ****
                    {option.account.accountNumber.slice(-4)} | IFSC:{" "}
                    {option.account.ifscCode}
                  </div>
                </div>
              )}
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 42,
                  fontSize: 14,
                  borderColor: state.isFocused ? "#f59e0b" : "#d1d5db",
                  boxShadow: state.isFocused
                    ? "0 0 0 1px #f59e0b"
                    : "none",
                  "&:hover": {
                    borderColor: "#f59e0b",
                  },
                }),
                menu: (base) => ({
                  ...base,
                  fontSize: 14,
                  maxHeight: 300,
                  zIndex: 9999,
                }),
                menuList: (base) => ({
                  ...base,
                  maxHeight: 250,
                  overflowY: "auto",
                }),
                input: (base) => ({ ...base, color: "#374151" }),
                option: (base, state) => ({
                  ...base,
                  color: "#374151",
                  backgroundColor: state.isFocused ? "#fef3c7" : "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  padding: "8px 12px",
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "#9ca3af",
                  fontSize: 14,
                }),
              }}
              noOptionsMessage={() =>
                isLoadingBanks
                  ? "Loading bank accounts..."
                  : "No bank accounts found"
              }
              loadingMessage={() => "Loading bank accounts..."}
            />
          </div>
          {formData.bankAccount &&
            bankAccounts.find(
              (acc) => acc.id === formData.bankAccount
            ) && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                {(() => {
                  const selectedAccount = bankAccounts.find(
                    (acc) => acc.id === formData.bankAccount
                  );
                  return (
                    <div className="text-sm">
                      <div className="font-medium text-green-800 mb-1">
                        Selected Account:{" "}
                        {selectedAccount.accountHolder}
                      </div>
                      <div className="text-green-700 text-xs grid grid-cols-2 gap-2">
                        <span>Bank: {selectedAccount.bankName}</span>
                        <span>
                          Branch: {selectedAccount.branchName}
                        </span>
                        <span>
                          Account: ****
                          {selectedAccount.accountNumber.slice(-4)}
                        </span>
                        <span>
                          Balance: ₹
                          {selectedAccount.balance.toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
        </div>
      </div>

      {/* GST and TDS Fields - Show only when Justdial is selected */}
      {formData.paidTo === "justdial" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6 xl:gap-8 w-full">
          {/* GST Field */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              GST Number
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                #
              </span>
              <select
                name="GST"
                value={formData.GST}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none uppercase"
              >
                <option value="">Select GST Number</option>
                <option value="27BVDPM3913M1ZB">27BVDPM3913M1ZB</option>
                <option value="27AGJPJ1251B1ZW">27AGJPJ1251B1ZW</option>
              </select>
            </div>
            {formData.GST && (
              <p className="text-xs text-gray-500 mt-1">
                GST Number: {formData.GST.toUpperCase()}
              </p>
            )}
          </div>

          {/* TDS Field */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              TDS Amount (₹)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                ₹
              </span>
              <input
                type="number"
                name="TdsAmount"
                value={formData.TdsAmount}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            {formData.TdsAmount && (
              <p className="text-xs text-gray-500 mt-1">
                TDS: ₹
                {parseFloat(formData.TdsAmount || 0).toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">No of Days</label>
            <select
              name="noOfDays"
              value={formData.noOfDays || ""}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full pl-3 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200"
            >
              <option value="" disabled>Select number of days</option>
              <option value="90">90</option>
              <option value="180">180</option>
              <option value="360">360</option>
            </select>
          </div>
        </div>
      )}

      {/* Total Amount Display - Show when Justdial is selected and has amount */}
      {formData.paidTo === "justdial" && formData.amount && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            Calculation Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600 block">Base Amount:</span>
              <div className="font-medium text-blue-800">
                ₹
                {parseFloat(formData.amount || 0).toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </div>
            </div>
            <div>
              <span className="text-blue-600 block">GST Number:</span>
              <div className="font-medium text-blue-800">
                {formData.GST
                  ? formData.GST.toUpperCase()
                  : "Not provided"}
              </div>
            </div>
            <div>
              <span className="text-blue-600 block">TDS:</span>
              <div className="font-medium text-blue-800">
                ₹
                {parseFloat(formData.TdsAmount || 0).toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </div>
            </div>
            <div className="bg-blue-100 p-2 rounded">
              <span className="text-blue-600 block font-semibold">
                Total (Amount - TDS):
              </span>
              <div className="font-bold text-lg text-blue-900">
                ₹
                {(
                  parseFloat(formData.amount || 0) -
                  parseFloat(formData.TdsAmount || 0)
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Selection - Hidden for Double Tick Api, Spa Jobs, or Spa Advisor */}
      {formData.paidTo !== "Double Tick Api" && formData.paidTo !== "Spa Jobs" && formData.paidTo !== "spa advisor" && (
        <LocationSelector
          formData={formData}
          setFormData={setFormData}
          isDataLoading={isDataLoading}
          centres={centres}
          filteredBranches={filteredBranches}
          filteredCentres={filteredCentres}
          currentUser={currentUser}
          accessDeniedEntries={accessDeniedEntries}
          setShowAccessDeniedModal={setShowAccessDeniedModal}
          disableLocalStorage={isEditMode}
        />
      )}

      {/* Selected Locations Display */}
      {formData.paidTo !== "Double Tick Api" && formData.paidTo !== "Spa Jobs" && formData.paidTo !== "spa advisor" && (
        <SelectedLocationsDisplay
          formData={formData}
          setFormData={setFormData}
          isDataLoading={isDataLoading}
          centres={centres}
        />
      )}

      {/* Reason */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Reason *
        </label>
        <div className="relative mt-1">
          <FiFileText className="absolute left-3 top-3 text-gray-400 text-sm" />
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Describe the advertising expense purpose..."
            rows="3"
            className="w-full pl-9 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`mt-8 ${isEditMode ? 'flex gap-4' : ''}`}>
        {isEditMode && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="flex-1 py-3 lg:py-2 xl:py-2 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold text-base lg:text-lg xl:text-xl rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            disabled={isLoading}
          >
            <FiX className="text-lg" />
            <span>Cancel Edit</span>
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`${isEditMode ? 'flex-1' : 'w-full'} py-3 lg:py-2 xl:py-2 ${isEditMode
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-400'
            : 'bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 focus:ring-amber-400'
            } text-white font-semibold text-base lg:text-lg xl:text-xl rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{isEditMode ? 'Updating Expense...' : 'Adding Expense...'}</span>
            </>
          ) : (
            <>
              <FiSave className="text-lg" />
              <span>{isEditMode ? 'Review & Update Expense' : 'Review & Add Expense'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
