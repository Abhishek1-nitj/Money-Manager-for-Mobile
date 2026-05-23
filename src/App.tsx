import { useEffect, useMemo, useState } from 'react'
import './App.css'

type TransactionType = 'income' | 'expense' | 'transfer'
type View = 'transactions' | 'accounts' | 'overview'
type PickerField = 'account' | 'from' | 'to' | null

type Account = {
  id: string
  name: string
  openingBalance: number
}

type Transaction = {
  id: string
  type: TransactionType
  amount: number
  category: string
  note: string
  description: string
  createdAt: string
  accountId?: string
  fromAccountId?: string
  toAccountId?: string
}

type Draft = {
  type: TransactionType
  accountId: string
  fromAccountId: string
  toAccountId: string
  category: string
  amount: string
  note: string
  description: string
}

type StoredData = {
  accounts: Account[]
  transactions: Transaction[]
}

const STORAGE_KEY = 'money-manager-lite-v1'

const seededAccounts: Account[] = [
  { id: crypto.randomUUID(), name: 'ICICI Bank', openingBalance: 178462.7 },
  { id: crypto.randomUUID(), name: 'ICICI CC', openingBalance: 1378.58 },
  { id: crypto.randomUUID(), name: 'CASH', openingBalance: 4400 },
  { id: crypto.randomUUID(), name: 'PNB', openingBalance: 10001.86 },
  { id: crypto.randomUUID(), name: 'HDFC', openingBalance: 38646.73 },
  { id: crypto.randomUUID(), name: 'Mutual Fund', openingBalance: 44781 },
  { id: crypto.randomUUID(), name: 'My idfc', openingBalance: 10535.83 },
  { id: crypto.randomUUID(), name: 'Father idfc', openingBalance: 12001 },
  { id: crypto.randomUUID(), name: 'HDFC FLEXI', openingBalance: 0 },
]

const now = new Date()

const seededTransactions: Transaction[] = [
  {
    id: crypto.randomUUID(),
    type: 'expense',
    amount: 2948.82,
    category: 'Variable Expense',
    note: 'Course excel instamojo',
    description: 'Learning purchase',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 23, 18, 49).toISOString(),
    accountId: seededAccounts[1].id,
  },
  {
    id: crypto.randomUUID(),
    type: 'expense',
    amount: 172,
    category: 'Food',
    note: 'Food outside tea',
    description: 'Snacks',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 23, 15, 15).toISOString(),
    accountId: seededAccounts[0].id,
  },
  {
    id: crypto.randomUUID(),
    type: 'income',
    amount: 5606.26,
    category: 'Sales',
    note: 'Sold excel course',
    description: 'Digital sale',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 23, 13, 10).toISOString(),
    accountId: seededAccounts[0].id,
  },
  {
    id: crypto.randomUUID(),
    type: 'expense',
    amount: 1711.58,
    category: 'Home',
    note: 'Sleepwell',
    description: 'Household',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 23, 9, 42).toISOString(),
    accountId: seededAccounts[0].id,
  },
  {
    id: crypto.randomUUID(),
    type: 'income',
    amount: 1131.64,
    category: 'Sales',
    note: 'Sold excel course',
    description: 'Digital sale',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 21, 11, 4).toISOString(),
    accountId: seededAccounts[0].id,
  },
  {
    id: crypto.randomUUID(),
    type: 'transfer',
    amount: 2500,
    category: 'Transfer',
    note: 'Move to cash',
    description: 'ATM withdrawal',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 20, 17, 20).toISOString(),
    fromAccountId: seededAccounts[0].id,
    toAccountId: seededAccounts[2].id,
  },
]

const defaultData: StoredData = {
  accounts: seededAccounts,
  transactions: seededTransactions,
}

const emptyDraft: Draft = {
  type: 'expense',
  accountId: '',
  fromAccountId: '',
  toAccountId: '',
  category: '',
  amount: '',
  note: '',
  description: '',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  const dateText = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    weekday: 'short',
  }).format(date)
  const timeText = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
  return { dateText, timeText }
}

function formatDayHeading(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    weekday: 'short',
  }).format(date)
}

function isSameMonth(date: Date, basis: Date) {
  return date.getFullYear() === basis.getFullYear() && date.getMonth() === basis.getMonth()
}

function App() {
  const [data, setData] = useState<StoredData>(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultData
    }

    try {
      return JSON.parse(raw) as StoredData
    } catch {
      return defaultData
    }
  })
  const [activeView, setActiveView] = useState<View>('transactions')
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [showComposer, setShowComposer] = useState(false)
  const [pickerField, setPickerField] = useState<PickerField>(null)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newOpeningBalance, setNewOpeningBalance] = useState('')

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const accountsById = useMemo(
    () =>
      data.accounts.reduce<Record<string, Account>>((map, account) => {
        map[account.id] = account
        return map
      }, {}),
    [data.accounts],
  )

  const accountBalances = useMemo(() => {
    const balances = data.accounts.reduce<Record<string, number>>((map, account) => {
      map[account.id] = account.openingBalance
      return map
    }, {})

    for (const tx of data.transactions) {
      if (tx.type === 'income' && tx.accountId) {
        balances[tx.accountId] = (balances[tx.accountId] ?? 0) + tx.amount
      }
      if (tx.type === 'expense' && tx.accountId) {
        balances[tx.accountId] = (balances[tx.accountId] ?? 0) - tx.amount
      }
      if (tx.type === 'transfer' && tx.fromAccountId && tx.toAccountId) {
        balances[tx.fromAccountId] = (balances[tx.fromAccountId] ?? 0) - tx.amount
        balances[tx.toAccountId] = (balances[tx.toAccountId] ?? 0) + tx.amount
      }
    }

    return balances
  }, [data.accounts, data.transactions])

  const sortedTransactions = useMemo(
    () => [...data.transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [data.transactions],
  )

  const noteSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          data.transactions
            .map((transaction) => transaction.note.trim())
            .filter((note) => note.length > 0),
        ),
      ),
    [data.transactions],
  )

  const totalBalance = useMemo(
    () => Object.values(accountBalances).reduce((sum, value) => sum + value, 0),
    [accountBalances],
  )

  const monthlySummary = useMemo(() => {
    const current = new Date()
    return sortedTransactions.reduce(
      (summary, transaction) => {
        if (!isSameMonth(new Date(transaction.createdAt), current)) {
          return summary
        }
        if (transaction.type === 'income') {
          summary.income += transaction.amount
        }
        if (transaction.type === 'expense') {
          summary.expense += transaction.amount
        }
        return summary
      },
      { income: 0, expense: 0 },
    )
  }, [sortedTransactions])

  const groupedTransactions = useMemo(() => {
    return sortedTransactions.reduce<
      Array<{
        key: string
        heading: string
        income: number
        expense: number
        items: Transaction[]
      }>
    >((groups, transaction) => {
      const date = new Date(transaction.createdAt)
      const key = date.toISOString().slice(0, 10)
      const existing = groups.find((group) => group.key === key)

      if (!existing) {
        groups.push({
          key,
          heading: formatDayHeading(transaction.createdAt),
          income: transaction.type === 'income' ? transaction.amount : 0,
          expense: transaction.type === 'expense' ? transaction.amount : 0,
          items: [transaction],
        })
        return groups
      }

      existing.items.push(transaction)
      if (transaction.type === 'income') {
        existing.income += transaction.amount
      }
      if (transaction.type === 'expense') {
        existing.expense += transaction.amount
      }
      return groups
    }, [])
  }, [sortedTransactions])

  const pickerTitle =
    pickerField === 'account'
      ? 'Select account'
      : pickerField === 'from'
        ? 'Select from account'
        : pickerField === 'to'
          ? 'Select to account'
          : ''

  const transactionMoment = formatDateTime(new Date().toISOString())

  const resetComposer = () => {
    setDraft(emptyDraft)
    setPickerField(null)
    setShowComposer(false)
  }

  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const selectAccount = (accountId: string) => {
    if (pickerField === 'account') {
      updateDraft('accountId', accountId)
    }
    if (pickerField === 'from') {
      updateDraft('fromAccountId', accountId)
      if (draft.toAccountId === accountId) {
        updateDraft('toAccountId', '')
      }
    }
    if (pickerField === 'to') {
      updateDraft('toAccountId', accountId)
      if (draft.fromAccountId === accountId) {
        updateDraft('fromAccountId', '')
      }
    }
    setPickerField(null)
  }

  const saveAccount = () => {
    const name = newAccountName.trim()
    if (!name) {
      return
    }

    setData((current) => ({
      ...current,
      accounts: [
        ...current.accounts,
        {
          id: crypto.randomUUID(),
          name,
          openingBalance: Number.parseFloat(newOpeningBalance || '0') || 0,
        },
      ],
    }))
    setNewAccountName('')
    setNewOpeningBalance('')
    setShowAccountForm(false)
  }

  const saveTransaction = () => {
    const amount = Number.parseFloat(draft.amount)
    if (!amount || amount <= 0) {
      return
    }

    if (draft.type === 'transfer') {
      if (!draft.fromAccountId || !draft.toAccountId || draft.fromAccountId === draft.toAccountId) {
        return
      }
    } else if (!draft.accountId) {
      return
    }

    const nextTransaction: Transaction = {
      id: crypto.randomUUID(),
      type: draft.type,
      amount,
      category: draft.category.trim() || (draft.type === 'transfer' ? 'Transfer' : 'Uncategorized'),
      note: draft.note.trim(),
      description: draft.description.trim(),
      createdAt: new Date().toISOString(),
      accountId: draft.type === 'transfer' ? undefined : draft.accountId,
      fromAccountId: draft.type === 'transfer' ? draft.fromAccountId : undefined,
      toAccountId: draft.type === 'transfer' ? draft.toAccountId : undefined,
    }

    setData((current) => ({
      ...current,
      transactions: [nextTransaction, ...current.transactions],
    }))
    setActiveView('transactions')
    resetComposer()
  }

  const renderTransactionAccountLine = (transaction: Transaction) => {
    if (transaction.type === 'transfer') {
      const from = accountsById[transaction.fromAccountId ?? '']?.name ?? 'Unknown'
      const to = accountsById[transaction.toAccountId ?? '']?.name ?? 'Unknown'
      return `${from} -> ${to}`
    }

    return accountsById[transaction.accountId ?? '']?.name ?? 'Unknown'
  }

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">Money Manager</p>
            <h1>{activeView === 'transactions' ? 'Transactions' : activeView === 'accounts' ? 'Accounts' : 'Overview'}</h1>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              setShowComposer(true)
              setActiveView('transactions')
            }}
          >
            Add
          </button>
        </header>

        <main className="app-content">
          {activeView === 'overview' && (
            <section className="overview-view">
              <div className="hero-card">
                <div>
                  <p className="muted-label">Current balance</p>
                  <h2>{formatCurrency(totalBalance)}</h2>
                </div>
                <p className="subtle-copy">Minimal tracking for your day-to-day money flow.</p>
              </div>
              <div className="summary-grid">
                <article className="metric-card">
                  <span>Income</span>
                  <strong className="income-text">{formatCurrency(monthlySummary.income)}</strong>
                </article>
                <article className="metric-card">
                  <span>Expense</span>
                  <strong className="expense-text">{formatCurrency(monthlySummary.expense)}</strong>
                </article>
                <article className="metric-card">
                  <span>Net</span>
                  <strong>{formatCurrency(monthlySummary.income - monthlySummary.expense)}</strong>
                </article>
              </div>
              <div className="overview-list">
                <h3>Recent notes</h3>
                <div className="chip-row">
                  {noteSuggestions.slice(0, 8).map((note) => (
                    <span className="note-chip" key={note}>
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeView === 'transactions' && (
            <section className="transactions-view">
              <div className="month-strip">
                <div>
                  <p className="muted-label">This month</p>
                  <strong>{new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date())}</strong>
                </div>
                <div className="month-totals">
                  <span className="income-text">{formatCurrency(monthlySummary.income)}</span>
                  <span className="expense-text">{formatCurrency(monthlySummary.expense)}</span>
                </div>
              </div>

              <div className="transaction-groups">
                {groupedTransactions.map((group) => (
                  <section className="day-card" key={group.key}>
                    <header className="day-header">
                      <div>
                        <strong>{group.heading}</strong>
                      </div>
                      <div className="day-totals">
                        <span className="income-text">{formatCurrency(group.income)}</span>
                        <span className="expense-text">{formatCurrency(group.expense)}</span>
                      </div>
                    </header>

                    {group.items.map((transaction) => (
                      <article className="transaction-row" key={transaction.id}>
                        <div className="transaction-meta">
                          <span className="category-pill">{transaction.category}</span>
                          <div>
                            <h3>{transaction.note || transaction.description || transaction.category}</h3>
                            <p>{renderTransactionAccountLine(transaction)}</p>
                          </div>
                        </div>
                        <strong className={transaction.type === 'expense' ? 'expense-text' : 'income-text'}>
                          {transaction.type === 'expense' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </strong>
                      </article>
                    ))}
                  </section>
                ))}
              </div>
            </section>
          )}

          {activeView === 'accounts' && (
            <section className="accounts-view">
              <div className="summary-grid accounts-summary">
                <article className="metric-card">
                  <span>Assets</span>
                  <strong className="income-text">{formatCurrency(totalBalance)}</strong>
                </article>
                <article className="metric-card">
                  <span>Liabilities</span>
                  <strong className="expense-text">{formatCurrency(0)}</strong>
                </article>
                <article className="metric-card">
                  <span>Total</span>
                  <strong>{formatCurrency(totalBalance)}</strong>
                </article>
              </div>

              <div className="accounts-list">
                <div className="section-header">
                  <h3>Accounts</h3>
                  <button type="button" className="ghost-button" onClick={() => setShowAccountForm(true)}>
                    New account
                  </button>
                </div>

                {data.accounts.map((account) => (
                  <article className="account-row" key={account.id}>
                    <div>
                      <h3>{account.name}</h3>
                      <p>Opening {formatCurrency(account.openingBalance)}</p>
                    </div>
                    <strong>{formatCurrency(accountBalances[account.id] ?? account.openingBalance)}</strong>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>

        {activeView === 'transactions' && (
          <button
            type="button"
            className="fab"
            onClick={() => {
              setShowComposer(true)
              setDraft((current) => ({ ...current, type: 'expense' }))
            }}
          >
            +
          </button>
        )}

        <nav className="bottom-nav">
          <button
            type="button"
            className={activeView === 'transactions' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('transactions')}
          >
            <span>Trans.</span>
          </button>
          <button
            type="button"
            className={activeView === 'overview' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('overview')}
          >
            <span>Stats</span>
          </button>
          <button
            type="button"
            className={activeView === 'accounts' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('accounts')}
          >
            <span>Accounts</span>
          </button>
        </nav>

        {showComposer && (
          <div className="composer-backdrop" onClick={resetComposer}>
            <section className="composer-sheet" onClick={(event) => event.stopPropagation()}>
              <div className="sheet-handle" />
              <header className="composer-header">
                <div>
                  <p className="eyebrow">New transaction</p>
                  <h2>{draft.type[0].toUpperCase() + draft.type.slice(1)}</h2>
                </div>
                <button type="button" className="ghost-button" onClick={resetComposer}>
                  Close
                </button>
              </header>

              <div className="type-toggle">
                {(['income', 'expense', 'transfer'] as TransactionType[]).map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={draft.type === type ? `toggle-chip ${type}` : 'toggle-chip'}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        type,
                        accountId: type === 'transfer' ? '' : current.accountId,
                        fromAccountId: type === 'transfer' ? current.fromAccountId : '',
                        toAccountId: type === 'transfer' ? current.toAccountId : '',
                      }))
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="datetime-row">
                <span>Date</span>
                <strong>{transactionMoment.dateText}</strong>
                <strong>{transactionMoment.timeText}</strong>
              </div>

              <div className="form-grid">
                {draft.type !== 'transfer' && (
                  <label className="field">
                    <span>Account</span>
                    <button type="button" className="picker-button" onClick={() => setPickerField('account')}>
                      {accountsById[draft.accountId]?.name ?? 'Choose account'}
                    </button>
                  </label>
                )}

                {draft.type === 'transfer' && (
                  <>
                    <label className="field">
                      <span>From</span>
                      <button type="button" className="picker-button transfer" onClick={() => setPickerField('from')}>
                        {accountsById[draft.fromAccountId]?.name ?? 'Choose source account'}
                      </button>
                    </label>
                    <label className="field">
                      <span>To</span>
                      <button type="button" className="picker-button transfer" onClick={() => setPickerField('to')}>
                        {accountsById[draft.toAccountId]?.name ?? 'Choose destination account'}
                      </button>
                    </label>
                  </>
                )}

                <label className="field">
                  <span>Category</span>
                  <input
                    value={draft.category}
                    onChange={(event) => updateDraft('category', event.target.value)}
                    placeholder={draft.type === 'transfer' ? 'Transfer' : 'Enter category'}
                  />
                </label>

                <label className="field">
                  <span>Amount</span>
                  <input
                    inputMode="decimal"
                    value={draft.amount}
                    onChange={(event) => updateDraft('amount', event.target.value)}
                    placeholder="0.00"
                  />
                </label>

                <label className="field">
                  <span>Note</span>
                  <input
                    list="note-suggestions"
                    value={draft.note}
                    onChange={(event) => updateDraft('note', event.target.value)}
                    placeholder="Saved note suggestions will appear here"
                  />
                </label>

                <label className="field">
                  <span>Description</span>
                  <textarea
                    rows={3}
                    value={draft.description}
                    onChange={(event) => updateDraft('description', event.target.value)}
                    placeholder="Optional details"
                  />
                </label>
              </div>

              <datalist id="note-suggestions">
                {noteSuggestions.map((note) => (
                  <option value={note} key={note} />
                ))}
              </datalist>

              <button type="button" className="primary-button" onClick={saveTransaction}>
                Save transaction
              </button>

              <section className="picker-panel">
                <div className="section-header">
                  <h3>Accounts</h3>
                  <button type="button" className="ghost-button" onClick={() => setShowAccountForm(true)}>
                    Add
                  </button>
                </div>
                <div className="account-grid">
                  {data.accounts.map((account) => (
                    <button
                      type="button"
                      key={account.id}
                      className="account-tile"
                      onClick={() => {
                        if (draft.type === 'transfer') {
                          setPickerField(pickerField ?? 'from')
                        } else {
                          updateDraft('accountId', account.id)
                        }
                        if (pickerField) {
                          selectAccount(account.id)
                        }
                      }}
                    >
                      <span>{account.name}</span>
                      <strong>{formatCurrency(accountBalances[account.id] ?? account.openingBalance)}</strong>
                    </button>
                  ))}
                </div>
              </section>
            </section>
          </div>
        )}

        {pickerField && (
          <div className="picker-backdrop" onClick={() => setPickerField(null)}>
            <section className="picker-sheet" onClick={(event) => event.stopPropagation()}>
              <div className="section-header">
                <h3>{pickerTitle}</h3>
                <button type="button" className="ghost-button" onClick={() => setPickerField(null)}>
                  Close
                </button>
              </div>
              <div className="account-grid picker-grid">
                {data.accounts.map((account) => (
                  <button type="button" key={account.id} className="account-tile" onClick={() => selectAccount(account.id)}>
                    <span>{account.name}</span>
                    <strong>{formatCurrency(accountBalances[account.id] ?? account.openingBalance)}</strong>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {showAccountForm && (
          <div className="picker-backdrop" onClick={() => setShowAccountForm(false)}>
            <section className="picker-sheet compact-sheet" onClick={(event) => event.stopPropagation()}>
              <div className="section-header">
                <h3>Add account</h3>
                <button type="button" className="ghost-button" onClick={() => setShowAccountForm(false)}>
                  Close
                </button>
              </div>
              <label className="field">
                <span>Name</span>
                <input
                  value={newAccountName}
                  onChange={(event) => setNewAccountName(event.target.value)}
                  placeholder="e.g. SBI Savings"
                />
              </label>
              <label className="field">
                <span>Opening balance</span>
                <input
                  inputMode="decimal"
                  value={newOpeningBalance}
                  onChange={(event) => setNewOpeningBalance(event.target.value)}
                  placeholder="0.00"
                />
              </label>
              <button type="button" className="primary-button" onClick={saveAccount}>
                Save account
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
