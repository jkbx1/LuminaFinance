import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Table as TableIcon,
  Columns as ColumnsIcon,
  CreditCard
} from "lucide-react";
import Papa from "papaparse";
import { type Transaction } from "./ExpenseCard";

interface CSVImportViewProps {
  onBatchAdd: (transactions: Omit<Transaction, "id">[]) => void;
  onCancel: () => void;
}

interface Mapping {
  date: number;
  amount: number;
  description: number;
  category: number;
  currency: number;
}

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "PLN", "JPY", "CAD"];

export const CSVImportView: React.FC<CSVImportViewProps> = ({
  onBatchAdd,
  onCancel,
}) => {
  const [step, setStep] = useState<"upload" | "map" | "confirm">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[][]>([]);
  const [headerIndex, setHeaderIndex] = useState<number>(-1);
  const [mapping, setMapping] = useState<Mapping>({
    date: -1,
    amount: -1,
    description: -1,
    category: -1,
    currency: -1,
  });
  const [error, setError] = useState<string | null>(null);
  const [skipRows, setSkipRows] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    setError(null);

    Papa.parse(file, {
      encoding: "CP1250",
      skipEmptyLines: "greedy",
      complete: (results) => {
        const rows = results.data as any[][];
        if (rows.length < 2) {
          setError("The CSV file seems too short or empty.");
          return;
        }
        setCsvData(rows);
        const detectedHeaderIdx = findHeaderRow(rows);
        setHeaderIndex(detectedHeaderIdx);
        setSkipRows(detectedHeaderIdx);
        if (detectedHeaderIdx !== -1) {
          autoMapColumns(rows[detectedHeaderIdx]);
        }
        setStep("map");
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const findHeaderRow = (rows: any[][]): number => {
    const keywords = ["date", "data", "amount", "kwota", "description", "opis", "tytuł", "title"];
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
        const rowString = rows[i].join(" ").toLowerCase();
        const matches = keywords.filter(k => rowString.includes(k));
        if (matches.length >= 2) return i;
    }
    return 0;
  };

  const autoMapColumns = (headers: any[]) => {
    const newMapping = { date: -1, amount: -1, description: -1, category: -1, currency: -1 };
    headers.forEach((h, idx) => {
      const header = String(h).toLowerCase();
      if (header.includes("dat")) newMapping.date = idx;
      if (header.includes("kwot") || header.includes("amoun")) newMapping.amount = idx;
      if (header.includes("opis") || header.includes("desc") || header.includes("tytu") || header.includes("counterp") || header.includes("odbiorc")) {
          newMapping.description = idx;
      }
      if (header.includes("kateg") || header.includes("categ")) newMapping.category = idx;
      if (header.includes("walut") || header.includes("curren")) newMapping.currency = idx;
    });
    setMapping(newMapping);
  };

  const normalizedData = useMemo(() => {
    if (headerIndex === -1 || step !== "confirm") return [];
    const rowsToProcess = csvData.slice(headerIndex + 1);
    const defaultCurrency = localStorage.getItem("lumina_currency") ?? "USD";

    return rowsToProcess
      .map(row => {
          // ... existing mapping logic ...
          const dateVal = row[mapping.date];
          const amountVal = String(row[mapping.amount] || "0");
          const descVal = row[mapping.description] || "Imported Transaction";
          const catVal = mapping.category !== -1 ? row[mapping.category] : "Imported";
          const currVal = mapping.currency !== -1 ? String(row[mapping.currency]).toUpperCase() : defaultCurrency;

          let date = new Date(dateVal);
          if (isNaN(date.getTime())) {
              const dmy = String(dateVal).match(/(\d{2})[.-](\d{2})[.-](\d{4})/);
              if (dmy) date = new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}`);
          }

          const cleanAmount = amountVal.replace(/[^\d,.+-]/g, '').replace(',', '.');
          const amount = parseFloat(cleanAmount);
          const type: "income" | "expense" = amount >= 0 ? "income" : "expense";
          
          const category = String(catVal || "Imported").trim();
          const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

          let finalCurrency = currVal;
          if (!SUPPORTED_CURRENCIES.includes(currVal)) {
              finalCurrency = defaultCurrency;
          }

          return {
            title: descVal.length > 50 ? descVal.substring(0, 47) + "..." : descVal,
            amount: Math.abs(amount),
            type,
            category: normalizedCategory,
            currency: finalCurrency,
            date: isNaN(date.getTime()) ? new Date() : date,
            counterparty: descVal
          } as Omit<Transaction, "id">;
      })
      .filter(tx => tx.amount !== 0 || tx.title !== "Imported Transaction");
  }, [csvData, headerIndex, mapping, step]);

  const handleImport = () => {
    const batchId = crypto.randomUUID();
    const batchName = file?.name || "Imported Batch";
    const defaultCurrency = localStorage.getItem("lumina_currency") ?? "USD";

    // 1. Create the Batch Header transaction (0.00)
    const headerTx: Omit<Transaction, "id"> = {
      title: batchName,
      amount: 0,
      type: "income",
      category: "Import Session",
      currency: defaultCurrency,
      date: new Date(),
      batchId,
      batchName,
      isBatchHeader: true
    };

    // 2. Map other transactions with the same batchId
    // We filter out $0.00 records from the CSV itself to avoid redundancy with the header
    const finalData = [
        headerTx,
        ...normalizedData.map(tx => ({
            ...tx,
            amount: tx.type === "expense" ? -Math.abs(tx.amount) : Math.abs(tx.amount),
            batchId,
            batchName
        }))
    ];

    onBatchAdd(finalData);
  };

  const renderUpload = () => (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center h-full">
      <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center border border-accent/20">
        <Upload className="w-10 h-10 text-accent" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-bright mb-2">
          {file ? `Selected: ${file.name}` : "Upload your bank statement"}
        </h3>
        <p className="text-muted text-sm max-w-[280px] mx-auto">
          Drag and drop your .csv file here or click to browse. Privacy first: all processing happens locally.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <label className="w-full cursor-pointer group">
          <div className="border-2 border-dashed border-bg-border group-hover:border-accent/40 rounded-2xl p-6 transition-all bg-bg-card/20 group-hover:bg-accent/5">
            <span className="text-accent font-semibold group-hover:underline">Choose a CSV file</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </div>
        </label>
        <button
          type="button"
          onClick={onCancel}
          className="py-2.5 px-4 rounded-full border border-bg-border text-muted font-bold text-xs hover:text-bright hover:bg-bg-card/50 transition-all"
        >
          Cancel
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-400/10 p-3 rounded-xl border border-rose-400/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  const renderMapping = () => {
    const previewRows = csvData.slice(skipRows + 1, skipRows + 4);
    const headers = csvData[skipRows] || [];

    return (
      <div className="flex flex-col flex-1 min-h-0 px-5 sm:px-8 py-4 space-y-4">
        <div className="shrink-0 flex items-center justify-between">
          <h4 className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-2">
            <ColumnsIcon className="w-3.5 h-3.5" /> Map Columns
          </h4>
          <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted font-bold uppercase">Skip rows:</span>
              <input 
                  type="number" 
                  value={skipRows} 
                  onChange={(e) => setSkipRows(Math.max(0, parseInt(e.target.value) || 0))} 
                  className="w-10 bg-bg-card/50 border border-bg-border rounded-md px-1 py-0.5 text-xs text-bright outline-none focus:border-accent/40"
              />
          </div>
        </div>

        <div 
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-4 px-1 scrollbar-thin scrollbar-thumb-bg-border scrollbar-track-transparent"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
          }}
        >
          <div className="grid grid-cols-1 gap-3 pb-4">
            {[
              { label: "Date Column", key: "date" as keyof Mapping },
              { label: "Amount Column", key: "amount" as keyof Mapping },
              { label: "Description / Counterparty", key: "description" as keyof Mapping },
              { label: "Category (Optional)", key: "category" as keyof Mapping },
              { label: "Currency (Optional)", key: "currency" as keyof Mapping },
            ].map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted ml-1 uppercase tracking-wider">{field.label}</label>
                <select
                  value={mapping[field.key]}
                  onChange={(e) => setMapping({ ...mapping, [field.key]: parseInt(e.target.value) })}
                  className="w-full bg-bg-card/50 border border-bg-border rounded-xl py-2.5 px-4 text-bright text-sm outline-none focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer"
                >
                  <option value={-1}>
                    {field.label.includes("Optional") ? "Default / Auto-detect" : "Select column..."}
                  </option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{String(h) || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="space-y-3 pb-8">
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
              <TableIcon className="w-3.5 h-3.5" /> Data Preview
            </h4>
            <div className="overflow-x-auto rounded-xl border border-bg-border bg-bg-card/10">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-bg-card/50">
                    {headers.map((h, i) => (
                      <th key={i} className={`p-2 border-r border-bg-border last:border-0 font-bold ${
                          Object.values(mapping).includes(i) ? "text-accent" : "text-muted"
                      }`}>
                        {String(h) || `Col ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr key={ri} className="border-t border-bg-border hover:bg-white/2">
                      {row.map((cell, ci) => (
                        <td key={ci} className={`p-2 border-r border-bg-border last:border-0 text-bright truncate max-w-[100px] ${
                            Object.values(mapping).includes(ci) ? "bg-accent/5" : ""
                        }`}>
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 shrink-0">
          <button
            onClick={() => setStep("upload")}
            className="flex-1 py-3 px-4 rounded-full border border-bg-border text-muted font-bold text-sm hover:text-bright hover:bg-bg-card/50 transition-all flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            disabled={mapping.date === -1 || mapping.amount === -1 || mapping.description === -1}
            onClick={() => {
                setHeaderIndex(skipRows);
                setStep("confirm");
            }}
            className="flex-[2] py-3 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-lg shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Review {csvData.length - skipRows - 1} Rows <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderConfirm = () => (
    <div className="flex flex-col flex-1 min-h-0 px-5 sm:px-8 py-4 space-y-4">
      <div 
        className="flex-1 min-h-0 overflow-y-auto space-y-3 px-1 scrollbar-thin scrollbar-thumb-bg-border scrollbar-track-transparent"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 32px, black calc(100% - 32px), transparent 100%)",
        }}
      >
        <div className="sticky top-0 z-20 bg-bg-card/5 backdrop-blur-sm py-3 mb-1">
          <h4 className="text-sm font-bold text-muted uppercase tracking-widest text-center">
            Ready to Import
          </h4>
        </div>
        <div className="space-y-2.5 pb-8 pt-2">
          {normalizedData.map((tx, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4) }}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-bg-border bg-bg-card/40 hover:bg-bg-card/60 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl border shadow-lg ${
                  tx.type === "income" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5" 
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/5"
                }`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-bright font-semibold text-sm truncate max-w-[200px]">{tx.title}</p>
                  <p className="text-muted text-[10px] font-medium tracking-wide">{tx.date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm tracking-tight ${tx.type === "income" ? "text-emerald-400" : "text-bright"}`}>
                  {tx.type === "income" ? "+" : "-"}{tx.amount.toFixed(2)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-4 backdrop-blur-md">
          <div className="bg-emerald-500/20 p-1.5 rounded-full mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          </div>
          <div>
              <p className="text-emerald-400 font-bold text-base leading-tight">Everything looks good!</p>
              <p className="text-muted text-xs mt-1 leading-relaxed">
                A total of <span className="text-emerald-400 font-bold">{normalizedData.length}</span> transactions are ready to be imported. 
                <br />
                <span className="text-accent font-medium mt-1 inline-block">A 0.00 transaction with the filename will be created as a header. Delete it anytime to remove the entire batch.</span>
              </p>
          </div>
      </div>

      <div className="flex gap-3 pt-2 shrink-0">
        <button
          onClick={() => setStep("map")}
          className="flex-1 py-3 px-4 rounded-full border border-bg-border text-muted font-bold text-sm hover:text-bright hover:bg-bg-card/50 transition-all font-bold"
        >
          Adjust Mapping
        </button>
        <button
          onClick={handleImport}
          className="flex-[2] py-3.5 px-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-xl shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 uppercase tracking-wide"
        >
          Confirm & Save
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 min-h-0 w-full"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col min-h-0"
        >
          {step === "upload" && renderUpload()}
          {step === "map" && renderMapping()}
          {step === "confirm" && renderConfirm()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
