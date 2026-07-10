"use client";

import React, { useEffect, useState } from "react";
import { getExpenses, createExpense } from "../../../services/data";
import { Expense } from "../../../types/index";
import { 
  Plus, DollarSign, Wallet, ArrowUpRight, Loader2, 
  FileText, CheckCircle2, TrendingDown, Tag, PieChart
} from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Reagents"); // Reagents, Rent, Salary, Utilities, Other
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash"); // Cash, Card, UPI

  const [toastMsg, setToastMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    try {
      const exp = await createExpense({
        description,
        category,
        amount: Number(amount),
        payment_method: paymentMethod
      });
      setExpenses([exp, ...expenses]);
      setDescription("");
      setAmount(0);
      setPaymentMethod("Cash");
      showToast("Expense logged successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to log expense.");
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Calculate totals
  const calculateTotal = () => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getPaymentSplit = () => {
    const split = { Cash: 0, Card: 0, UPI: 0 };
    expenses.forEach(e => {
      const method = e.payment_method || "Cash";
      if (method in split) {
        split[method as keyof typeof split] += e.amount;
      }
    });
    return split;
  };

  const getCategorySplit = () => {
    const split: Record<string, number> = {};
    expenses.forEach(e => {
      split[e.category] = (split[e.category] || 0) + e.amount;
    });
    return split;
  };

  const paymentSplit = getPaymentSplit();
  const categorySplit = getCategorySplit();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-success rounded-lg shadow-lg text-white font-medium text-xs">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Operating Expenses</h1>
        <p className="text-[10px] text-mutedText">Log LIS diagnostics clinic reagents, salaries, utility bills, and other expenses</p>
      </div>

      {/* Grid Layout */}
      <div className="grid md:grid-cols-3 gap-8 text-xs font-medium">
        
        {/* Left Columns: Form and List */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Add Expense Form */}
          <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-xs border-b border-borders dark:border-slate-855 pb-2">Log new expense</h3>
            
            <form onSubmit={handleRecordExpense} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-500 mb-1">Description / Memo *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  placeholder="e.g. Purchase of CBC reagents from supplier"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                >
                  <option value="Reagents">Reagents / Consumables</option>
                  <option value="Rent">Rent</option>
                  <option value="Salary">Salary</option>
                  <option value="Utilities">Utilities (Power, Net)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Amount (Rs.) *</label>
                <input
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none font-bold"
                  placeholder="Amount"
                  min={1}
                  required
                />
              </div>

              <div className="col-span-2 grid grid-cols-3 gap-4 items-end">
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="px-3 w-full h-10 rounded-lg border border-borders dark:border-darkBorders bg-transparent text-xs focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="h-10 bg-blue-650 hover:bg-blue-755 text-white font-bold rounded-lg shadow-sm transition-all"
                >
                  Log Expense
                </button>
              </div>

            </form>
          </div>

          {/* Expenses List */}
          <div className="bg-white dark:bg-darkCard rounded-xl border border-borders dark:border-darkBorders shadow-sm overflow-hidden">
            <h3 className="px-5 py-4 font-bold text-slate-800 dark:text-white text-xs border-b border-borders dark:border-darkBorders">Expense ledger</h3>
            <div className="divide-y divide-borders dark:divide-darkBorders">
              {expenses.length === 0 ? (
                <div className="p-6 text-center text-mutedText">No expenses logged.</div>
              ) : (
                expenses.map(exp => (
                  <div key={exp.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-50 text-danger rounded-lg dark:bg-red-950/20"><Tag className="h-4 w-4" /></div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">{exp.description}</div>
                        <div className="text-[10px] text-slate-400">Category: {exp.category} &bull; Paid via {exp.payment_method}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{new Date(exp.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-danger">- Rs. {exp.amount}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Expense charts/analytics summary */}
        <div className="space-y-6">
          
          {/* Total Expense Card */}
          <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm space-y-4">
            <div className="border-b border-borders dark:border-slate-855 pb-2">
              <h3 className="font-bold text-slate-850 dark:text-white text-xs">Total Expenses</h3>
              <p className="text-[9px] text-slate-400">Total clinic cash outflows logged</p>
            </div>
            
            <div className="text-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-borders dark:border-darkBorders">
              <div className="text-[9px] text-slate-400 uppercase font-bold">Accumulated Expenses</div>
              <div className="text-2xl font-extrabold text-danger mt-1">Rs. {calculateTotal().toLocaleString()}</div>
            </div>

            {/* Split by payment method */}
            <div className="space-y-2">
              <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-wider">Payment splits</h4>
              <div className="space-y-1.5 text-[10px] text-slate-500">
                <div className="flex justify-between">
                  <span>Cash Outflows:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Rs. {paymentSplit.Cash}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI Outflows:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Rs. {paymentSplit.UPI}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Outflows:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Rs. {paymentSplit.Card}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Category split breakdown */}
          <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-borders dark:border-darkBorders shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-borders dark:border-slate-850 pb-2 mb-3 shrink-0">
              <PieChart className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-slate-850 dark:text-white text-xs">Category wise splits</h3>
            </div>
            <div className="space-y-3">
              {Object.keys(categorySplit).length === 0 ? (
                <p className="text-[10px] text-slate-400 italic py-2">No category splits computed.</p>
              ) : (
                Object.entries(categorySplit).map(([cat, amt]) => {
                  const percentage = calculateTotal() > 0 ? (amt / calculateTotal() * 100).toFixed(0) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>{cat}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Rs. {amt} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                        <div 
                          className="bg-red-500 h-1.5 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
