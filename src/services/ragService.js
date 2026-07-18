import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, ensureFirebaseSession } from '../firebase';

// Helper to extract YYYY-MM from user queries
function parseMonthYear(query) {
  const monthsMap = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12'
  };

  const lower = query.toLowerCase();
  
  for (const [name, num] of Object.entries(monthsMap)) {
    if (lower.includes(name)) {
      // Find year: look for numbers like "2025", "2026", "25", "26"
      const yearMatch = lower.match(/\b(20\d{2}|\d{2})\b/);
      if (yearMatch) {
        let year = yearMatch[1];
        if (year.length === 2) {
          year = '20' + year;
        }
        return `${year}-${num}`;
      }
      // Default to current year 2026 if no year found
      return `2026-${num}`;
    }
  }

  // Direct format check YYYY-MM
  const matchDirect = lower.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])\b/);
  if (matchDirect) {
    return `${matchDirect[1]}-${matchDirect[2]}`;
  }

  return null;
}

// Helper to determine intent and required collection
function analyzeIntent(query) {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('expense') || lowerQuery.includes('finance') || lowerQuery.includes('income') || lowerQuery.includes('saving') || lowerQuery.includes('salary') || lowerQuery.includes('balance') || lowerQuery.includes('cashflow') || lowerQuery.includes('spent') || lowerQuery.includes('earn')) {
    return { type: 'finance', query: lowerQuery };
  }
  if (lowerQuery.includes('loan') || lowerQuery.includes('lend') || lowerQuery.includes('lent') || lowerQuery.includes('borrow') || lowerQuery.includes('advance') || lowerQuery.includes('receivable') || lowerQuery.includes('gave money') || lowerQuery.includes('give money') || lowerQuery.includes('give loan') || lowerQuery.includes('gave loan')) {
    return { type: 'lending', query: lowerQuery };
  }
  if (lowerQuery.includes('purchase') || lowerQuery.includes('order') || lowerQuery.includes('shopping') || lowerQuery.includes('grocery') || lowerQuery.includes('amazon')) {
    return { type: 'purchases', query: lowerQuery };
  }
  if (lowerQuery.includes('future') || lowerQuery.includes('wishlist') || lowerQuery.includes('plan to buy') || lowerQuery.includes('planned buy') || lowerQuery.includes('planned expense') || lowerQuery.includes('planned purchase') || lowerQuery.includes('washing machine') || lowerQuery.includes('dishwasher') || lowerQuery.includes('balcony') || lowerQuery.includes('chopper') || lowerQuery.includes('food processor')) {
    return { type: 'wishlist', query: lowerQuery };
  }
  if (lowerQuery.includes('portfolio') || lowerQuery.includes('holding') || lowerQuery.includes('mutual fund') || lowerQuery.includes('stock') || lowerQuery.includes('share') || lowerQuery.includes('isin') || lowerQuery.includes('cagr') || lowerQuery.includes('xirr') || lowerQuery.includes('underperforming') || lowerQuery.includes('invested')) {
    return { type: 'portfolio', query: lowerQuery };
  }
  if (lowerQuery.includes('fee') || lowerQuery.includes('school') || lowerQuery.includes('amishi fee') || lowerQuery.includes('payment')) {
    return { type: 'fees', query: lowerQuery };
  }
  if (lowerQuery.includes('gym') || lowerQuery.includes('workout') || lowerQuery.includes('exercise') || lowerQuery.includes('run') || lowerQuery.includes('diet')) {
    return { type: 'gym', query: lowerQuery };
  }
  if (lowerQuery.includes('activity') || lowerQuery.includes('daily') || lowerQuery.includes('routine') || lowerQuery.includes('amishi activity')) {
    return { type: 'activity', query: lowerQuery };
  }
  if (lowerQuery.includes('calendar') || lowerQuery.includes('event') || lowerQuery.includes('schedule') || lowerQuery.includes('meeting') || lowerQuery.includes('reminder')) {
    return { type: 'calendar', query: lowerQuery };
  }
  
  return { type: 'unknown', query: lowerQuery };
}

export async function generateContextForQuery(query) {
  const intent = analyzeIntent(query);
  
  if (intent.type === 'unknown') {
    return null; 
  }

  try {
    await ensureFirebaseSession();
    if (!db) {
      return "(Note: Firebase Firestore is not initialized or configured)";
    }

    let contextStr = `Data retrieved from database for category "${intent.type}":\n\n`;

    if (intent.type === 'finance') {
      const parsedMonth = parseMonthYear(query);
      if (parsedMonth) {
        const docRef = doc(db, 'financeMonthly_family', `family_${parsedMonth}`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          contextStr += `Itemized Finance Records for ${parsedMonth}:\n`;
          contextStr += `--- Income Entries ---\n`;
          const income = data.income || [];
          if (income.length > 0) {
            income.forEach(inc => {
              contextStr += `- Date: ${inc.date}, Source: ${inc.source}, Amount: ₹${inc.amount}, Category: ${inc.category}, Credited To: ${inc.creditedTo}, Remark: ${inc.remark || 'N/A'}\n`;
            });
          } else {
            contextStr += `No income entries recorded.\n`;
          }

          contextStr += `\n--- Expense Entries ---\n`;
          const expenses = data.expenses || [];
          if (expenses.length > 0) {
            expenses.forEach(exp => {
              contextStr += `- Date: ${exp.date}, Vendor: ${exp.vendor}, Amount: ₹${exp.amount}, Category: ${exp.category}, Payment Mode: ${exp.paymentMode}, Purpose: ${exp.purpose || 'N/A'}, Ref No: ${exp.refNo || 'N/A'}\n`;
            });
          } else {
            contextStr += `No expense entries recorded.\n`;
          }
        } else {
          contextStr += `No monthly finance document found for month ${parsedMonth} (record: family_${parsedMonth}).\n`;
        }
      } else {
        // Summarize all months
        const snap = await getDocs(collection(db, 'financeMonthly_family'));
        if (!snap.empty) {
          contextStr += `Available Monthly Summaries:\n`;
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          docs.sort((a, b) => b.month.localeCompare(a.month)); // newest first
          
          docs.forEach(doc => {
            const inc = doc.income || [];
            const exp = doc.expenses || [];
            const totalInc = inc.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
            const totalExp = exp.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
            contextStr += `- Month: ${doc.month} (Doc: ${doc.id})\n`;
            contextStr += `  * Total Income: ₹${totalInc.toLocaleString('en-IN')}\n`;
            contextStr += `  * Total Expenses: ₹${totalExp.toLocaleString('en-IN')}\n`;
            contextStr += `  * Net Savings: ₹${(totalInc - totalExp).toLocaleString('en-IN')}\n`;
          });
        } else {
          contextStr += `No monthly finance records found in the database.\n`;
        }
      }
    } 
    else if (intent.type === 'purchases') {
      let ordersList = [];
      
      // 1. Fetch from root 'purchases' collection
      try {
        const snap = await getDocs(collection(db, 'purchases'));
        if (!snap.empty) {
          snap.docs.forEach(d => {
            const data = d.data();
            ordersList.push({
              source: 'purchases_collection',
              id: d.id,
              date: data.date || 'N/A',
              seller: data.seller || 'N/A',
              paidBy: data.paidBy || 'N/A',
              totalAmount: parseFloat(data.totalAmount) || 0,
              items: data.items || []
            });
          });
        }
      } catch (e) {
        console.error("Error fetching purchases collection:", e);
      }

      // 2. Fetch from 'financeMonthly_family' monthly expense lists as well (where category is Shopping/Food, or contains Order ID)
      try {
        const financeSnap = await getDocs(collection(db, 'financeMonthly_family'));
        if (!financeSnap.empty) {
          financeSnap.docs.forEach(doc => {
            const data = doc.data();
            const expenses = data.expenses || [];
            expenses.forEach(exp => {
              const amount = parseFloat(exp.amount) || 0;
              const purpose = (exp.purpose || '').toLowerCase();
              const vendor = (exp.vendor || '').toLowerCase();
              const category = (exp.category || '').toLowerCase();
              
              const isOrder = category === 'shopping' || 
                              purpose.includes('order id') || 
                              purpose.includes('auto-added') ||
                              vendor.includes('amazon') || 
                              vendor.includes('flipkart') || 
                              vendor.includes('myntra');
                              
              if (isOrder) {
                // Try to parse Order ID from purpose to avoid duplicate listing
                const orderIdMatch = purpose.match(/order id:\s*([a-zA-Z0-9_-]+)/i);
                const orderId = orderIdMatch ? orderIdMatch[1] : `exp-${exp.date}-${amount}`;
                
                const exists = ordersList.some(o => o.id === orderId);
                if (!exists) {
                  ordersList.push({
                    source: 'finance_expenses',
                    id: orderId,
                    date: exp.date || 'N/A',
                    seller: exp.vendor || 'N/A',
                    paidBy: exp.paymentMode || 'N/A',
                    totalAmount: amount,
                    items: [{ name: exp.purpose || 'Shopping Item', category: exp.category, price: amount }]
                  });
                }
              }
            });
          });
        }
      } catch (e) {
        console.error("Error fetching finance monthly for purchases context:", e);
      }

      if (ordersList.length > 0) {
        // Sort by date newest first
        ordersList.sort((a, b) => new Date(b.date) - new Date(a.date));
        contextStr += `Shopping and Purchase Logs (merged from purchases collection and shopping expenses):\n`;
        ordersList.forEach(o => {
          contextStr += `- Order ID: ${o.id}, Date: ${o.date}, Seller: ${o.seller}, Paid By: ${o.paidBy}, Total Amount: ₹${o.totalAmount} (Source: ${o.source === 'purchases_collection' ? 'Purchases Database' : 'Finance Expenses Ledger'})\n`;
          if (o.items && o.items.length > 0) {
            contextStr += `  Items:\n`;
            o.items.forEach(item => {
              contextStr += `    * ${item.name || 'Item'}: ₹${item.price || item.amount || o.totalAmount} (${item.category || 'Shopping'})\n`;
            });
          }
        });
      } else {
        contextStr += `No purchase orders or shopping expenses found in the database.\n`;
      }
    } 
    else if (intent.type === 'fees') {
      // School Fees
      const snap = await getDocs(collection(db, 'activities/amishi/fees'));
      if (!snap.empty) {
        contextStr += `School Fees Ledgers:\n`;
        snap.docs.forEach(d => {
          const item = d.data();
          contextStr += `- Term/Fee Item: ${item.title || item.name || d.id}\n`;
          contextStr += `  * Amount: ₹${item.amount}\n`;
          contextStr += `  * Status: ${item.status || (item.isPaid ? 'Paid' : 'Unpaid')}\n`;
          contextStr += `  * Date Paid: ${item.datePaid || item.paidDate || 'N/A'}\n`;
          contextStr += `  * Mode: ${item.paymentMode || 'N/A'}\n`;
          contextStr += `  * Remark: ${item.remark || 'N/A'}\n`;
        });
      } else {
        contextStr += `No school fee payment documents found in collection activities/amishi/fees.\n`;
      }
    } 
    else if (intent.type === 'gym') {
      contextStr += `Gym Workouts Logged:\n\n`;
      
      // Amit Gym
      const amitSnap = await getDocs(collection(db, 'activities/amit/gym'));
      contextStr += `--- Amit's Gym Logs ---\n`;
      if (!amitSnap.empty) {
        amitSnap.docs.forEach(d => {
          const l = d.data();
          contextStr += `- Date: ${l.date || d.id}, Workout: ${l.workout || l.activity || 'Gym Session'}, Details: ${l.remarks || l.details || 'N/A'}\n`;
        });
      } else {
        contextStr += `No gym sessions logged for Amit.\n`;
      }

      // Sweta Gym
      const swetaSnap = await getDocs(collection(db, 'activities/sweta/gym'));
      contextStr += `\n--- Sweta's Gym Logs ---\n`;
      if (!swetaSnap.empty) {
        swetaSnap.docs.forEach(d => {
          const l = d.data();
          contextStr += `- Date: ${l.date || d.id}, Workout: ${l.workout || l.activity || 'Gym Session'}, Details: ${l.remarks || l.details || 'N/A'}\n`;
        });
      } else {
        contextStr += `No gym sessions logged for Sweta.\n`;
      }
    } 
    else if (intent.type === 'activity') {
      const snap = await getDocs(collection(db, 'activities/amishi/daily'));
      if (!snap.empty) {
        contextStr += `Amishi's Daily Activity Details:\n`;
        const activities = snap.docs.map(d => ({ date: d.id, ...d.data() }));
        activities.sort((a, b) => b.date.localeCompare(a.date)); // newest first
        
        activities.slice(0, 30).forEach(act => {
          contextStr += `- Date: ${act.date}\n`;
          contextStr += `  * Routine/Activities: ${act.description || act.notes || act.remarks || 'Logged'}\n`;
          contextStr += `  * Rating/Mood: ${act.mood || act.rating || 'N/A'}\n`;
        });
      } else {
        contextStr += `No activity records logged for Amishi.\n`;
      }
    } 
    else if (intent.type === 'calendar') {
      const snap = await getDocs(collection(db, 'familyEvents'));
      if (!snap.empty) {
        contextStr += `Family Calendar Events:\n`;
        const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        events.sort((a, b) => a.date.localeCompare(b.date)); // chronological order
        
        events.forEach(e => {
          contextStr += `- Date: ${e.date}, Title: ${e.title}, Description: ${e.description || e.remarks || 'N/A'}, Category: ${e.category || 'General'}\n`;
        });
      } else {
        contextStr += `No family calendar events found in the database.\n`;
      }
    }
    else if (intent.type === 'lending') {
      const snap = await getDocs(collection(db, 'lendings'));
      if (!snap.empty) {
        contextStr += `Money Lent and Loans Given Tracker:\n`;
        const items = snap.docs.map(d => d.data());
        items.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        items.forEach(l => {
          contextStr += `- Date Given: ${l.date || 'N/A'}, Borrower: ${l.borrower || 'N/A'}, Amount: ₹${l.amount}, Expected Return: ${l.returnDate || 'Open Date'}, Status: ${l.status || 'Pending'}, Notes: ${l.notes || 'N/A'}\n`;
        });
      } else {
        contextStr += `No lending records or loans logged in the database.\n`;
      }
    }
    else if (intent.type === 'wishlist') {
      const snap = await getDocs(collection(db, 'future_purchases'));
      if (!snap.empty) {
        contextStr += `Planned Future Purchases & Wishlist:\n`;
        const items = snap.docs.map(d => d.data());
        items.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        items.forEach(w => {
          contextStr += `- Date Added: ${w.date || 'N/A'}, Item Name: ${w.itemName || 'N/A'}, Estimated Cost: ₹${w.estimatedCost}, Priority: ${w.priority || 'Medium'}, Status: ${w.status || 'Planned'}, Notes: ${w.notes || 'N/A'}\n`;
        });
      } else {
        contextStr += `No planned future purchases or wishlist items found in the database.\n`;
      }
    }
    else if (intent.type === 'portfolio') {
      const summarySnap = await getDocs(collection(db, 'portfolioSummary'));
      if (!summarySnap.empty) {
        const sum = summarySnap.docs[0].data();
        contextStr += `Portfolio Summary Statistics:\n`;
        contextStr += `- Total Invested: ₹${sum.totalInvested || 0}, Current Value: ₹${sum.totalCurrent || 0}, Gain/Loss: ₹${sum.overallGainLoss || 0} (${(sum.absoluteReturn || 0).toFixed(2)}% Absolute Return), CAGR: ${(sum.cagr || 0).toFixed(2)}%, XIRR: ${(sum.xirr || 0).toFixed(2)}%\n`;
      }
      
      const holdingsSnap = await getDocs(collection(db, 'holdings'));
      if (!holdingsSnap.empty) {
        contextStr += `Portfolio Holdings List:\n`;
        const items = holdingsSnap.docs.map(d => d.data());
        items.forEach(h => {
          if (h.type === 'mutualFund') {
            contextStr += `- Mutual Fund: ${h.schemeName}, Folio: ${h.folio}, Units: ${h.units}, NAV: ${h.nav}, Purchase Cost: ₹${h.purchaseValue}\n`;
          } else {
            contextStr += `- Stock: ${h.company} (${h.symbol}), Shares: ${h.quantity}, Avg Price: ₹${h.averagePrice}, Current Price: ₹${h.currentPrice}\n`;
          }
        });
      } else {
        contextStr += `No active holdings found in portfolio.\n`;
      }
    }

    return contextStr;
  } catch (error) {
    console.error("Error generating context for query:", error);
    return `Error retrieving database context: ${error.message}`;
  }
}

export async function getTabMetrics(tabId) {
  try {
    await ensureFirebaseSession();
    if (!db) return [];

    if (tabId === 'finance') {
      const snap = await getDocs(collection(db, 'financeMonthly_family'));
      if (snap.empty) {
        return [
          { label: 'Income (Latest)', value: '₹0', accent: '#10b981' },
          { label: 'Expense (Latest)', value: '₹0', accent: '#ef4444' },
          { label: 'Net Savings', value: '₹0', accent: '#3b82f6' }
        ];
      }
      
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => b.month.localeCompare(a.month)); // newest first
      const latestDoc = docs[0];
      const income = latestDoc.income || [];
      const expenses = latestDoc.expenses || [];
      const totalInc = income.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
      const totalExp = expenses.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
      
      return [
        { label: `Income (${latestDoc.month})`, value: `₹${totalInc.toLocaleString('en-IN')}`, accent: '#10b981' },
        { label: `Expense (${latestDoc.month})`, value: `₹${totalExp.toLocaleString('en-IN')}`, accent: '#ef4444' },
        { label: 'Net Savings', value: `₹${(totalInc - totalExp).toLocaleString('en-IN')}`, accent: '#3b82f6' }
      ];
    }


    if (tabId === 'family') {
      const eventSnap = await getDocs(collection(db, 'familyEvents'));
      const feeSnap = await getDocs(collection(db, 'activities/amishi/fees'));
      
      const feesList = feeSnap.docs.map(d => d.data());
      const unpaidCount = feesList.filter(f => f.status === 'Unpaid' || f.isPaid === false).length;
      
      return [
        { label: 'Calendar Events', value: eventSnap.size, accent: '#6366f1' },
        { label: 'Unpaid Fees', value: unpaidCount, accent: '#ef4444' },
        { label: 'Fee Terms', value: feesList.length, accent: '#10b981' }
      ];
    }

    if (tabId === 'personal') {
      const amitSnap = await getDocs(collection(db, 'activities/amit/gym'));
      const swetaSnap = await getDocs(collection(db, 'activities/sweta/gym'));
      
      return [
        { label: 'Amit Gym Logs', value: amitSnap.size, accent: '#3b82f6' },
        { label: 'Sweta Gym Logs', value: swetaSnap.size, accent: '#fd79a8' },
        { label: 'Active Workouts', value: amitSnap.size + swetaSnap.size, accent: '#10b981' }
      ];
    }

    if (tabId === 'lending') {
      const snap = await getDocs(collection(db, 'lendings'));
      const items = snap.docs.map(d => d.data());
      const totalPending = items
        .filter(i => i.status === 'Pending')
        .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      const totalSettled = items
        .filter(i => i.status === 'Settled')
        .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      
      return [
        { label: 'Receivables', value: `₹${totalPending.toLocaleString('en-IN')}`, accent: '#ef4444' },
        { label: 'Total Recovered', value: `₹${totalSettled.toLocaleString('en-IN')}`, accent: '#10b981' },
        { label: 'Active Loans', value: items.filter(i => i.status === 'Pending').length, accent: '#3b82f6' }
      ];
    }

    if (tabId === 'wishlist') {
      const snap = await getDocs(collection(db, 'future_purchases'));
      const items = snap.docs.map(d => d.data());
      const totalPlanned = items
        .filter(i => i.status === 'Planned')
        .reduce((sum, i) => sum + (parseFloat(i.estimatedCost) || 0), 0);
      const highPriority = items.filter(i => i.status === 'Planned' && i.priority === 'High').length;
      
      return [
        { label: 'Budget Needed', value: `₹${totalPlanned.toLocaleString('en-IN')}`, accent: '#f59e0b' },
        { label: 'High Priority', value: highPriority, accent: '#ef4444' },
        { label: 'Bought Items', value: items.filter(i => i.status === 'Bought').length, accent: '#10b981' }
      ];
    }

    if (tabId === 'portfolio') {
      const holdingsSnap = await getDocs(collection(db, 'holdings'));
      const items = holdingsSnap.docs.map(d => d.data());
      const mfCount = items.filter(i => i.type === 'mutualFund').length;
      const stockCount = items.filter(i => i.type === 'stock').length;
      return [
        { label: 'Total Mutual Funds', value: mfCount, accent: '#196c6c' },
        { label: 'Total Stocks Owned', value: stockCount, accent: '#c2644a' },
        { label: 'Total Assets Owned', value: items.length, accent: '#b98216' }
      ];
    }

    // Default general/overview tab metrics
    const financeSnap = await getDocs(collection(db, 'financeMonthly_family'));
    const lendingSnap = await getDocs(collection(db, 'lendings'));
    const eventSnap = await getDocs(collection(db, 'familyEvents'));
    
    let savingsStr = '₹0';
    if (!financeSnap.empty) {
      const docs = financeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => b.month.localeCompare(a.month));
      const latest = docs[0];
      const inc = (latest.income || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
      const exp = (latest.expenses || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
      savingsStr = `₹${(inc - exp).toLocaleString('en-IN')}`;
    }
    
    const receivablesCount = lendingSnap.docs.filter(d => d.data().status === 'Pending').length;

    return [
      { label: 'Monthly Savings', value: savingsStr, accent: '#10b981' },
      { label: 'Pending Receivables', value: receivablesCount, accent: '#6366f1' },
      { label: 'Calendar Reminders', value: eventSnap.size, accent: '#f59e0b' }
    ];
  } catch (error) {
    console.error("Error generating tab metrics:", error);
    return [];
  }
}
