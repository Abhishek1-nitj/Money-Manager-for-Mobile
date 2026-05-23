import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type TransactionType = 'income' | 'expense' | 'transfer'
type View = 'transactions' | 'accounts'
type EditorMode = 'create' | 'edit'
type AccountTarget = 'account' | 'from' | 'to'

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

type AccountDraft = {
  id: string | null
  name: string
  openingBalance: string
  mode: EditorMode
}

type StoredData = {
  accounts: Account[]
  transactions: Transaction[]
}

const STORAGE_KEY = 'money-manager-lite-v2'

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
    amount: 150,
    category: 'Food',
    note: 'Food outside tea',
    description: 'Tea',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 23, 11, 42).toISOString(),
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
    amount: 1514.77,
    category: 'Sales',
    note: 'Sold excel course',
    description: 'Digital sale',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 23, 8, 16).toISOString(),
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
    type: 'expense',
    amount: 210,
    category: 'Travel',
    note: 'FTH',
    description: 'Local commute',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 21, 9, 4).toISOString(),
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

const emptyAccountDraft: AccountDraft = {
  id: null,
  name: '',
  openingBalance: '',
  mode: 'create',
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

function formatDaySummary(iso: string) {
  const date = new Date(iso)
  return {
    day: new Intl.DateTimeFormat('en-GB', { day: '2-digit' }).format(date),
    weekday: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date),
    monthYear: new Intl.DateTimeFormat('en-IN', { month: '2-digit', year: 'numeric' }).format(date),
  }
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
  const [composerOpen, setComposerOpen] = useState(false)
  const [accountEditorOpen, setAccountEditorOpen] = useState(false)
  const [accountDraft, setAccountDraft] = useState<AccountDraft>(emptyAccountDraft)
  const [accountTarget, setAccountTarget] = useState<AccountTarget>('account')
  const overlayDepth = useRef(0)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    const onPopState = () => {
      if (accountEditorOpen) {
        setAccountEditorOpen(false)
        setAccountDraft(emptyAccountDraft)
        overlayDepth.current = Math.max(0, overlayDepth.current - 1)
        return
      }
      if (composerOpen) {
        setComposerOpen(false)
        setDraft(emptyDraft)
        overlayDepth.current = Math.max(0, overlayDepth.current - 1)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [accountEditorOpen, composerOpen])

  const pushOverlayHistory = () => {
    window.history.pushState({ overlay: true, depth: overlayDepth.current + 1 }, '')
    overlayDepth.current += 1
  }

  const closeComposer = () => {
    if (composerOpen) {
      window.history.back()
    }
  }

  const closeAccountEditor = () => {
    if (accountEditorOpen) {
      window.history.back()
    }
  }

  const openComposer = (type: TransactionType = 'expense') => {
    setDraft({
      ...emptyDraft,
      type,
      category: type === 'transfer' ? 'Transfer' : '',
    })
    setAccountTarget(type === 'transfer' ? 'from' : 'account')
    setComposerOpen(true)
    pushOverlayHistory()
  }

  const openAccountEditor = (account?: Account) => {
    if (account) {
      setAccountDraft({
        id: account.id,
        name: account.name,
        openingBalance: account.openingBalance.toString(),
        mode: 'edit',
      })
    } else {
      setAccountDraft(emptyAccountDraft)
    }
    setAccountEditorOpen(true)
    pushOverlayHistory()
  }

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
      } else if (tx.type === 'expense' && tx.accountId) {
        balances[tx.accountId] = (balances[tx.accountId] ?? 0) - tx.amount
      } else if (tx.type === 'transfer' && tx.fromAccountId && tx.toAccountId) {
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

  const monthlySummary = useMemo(() => {
    const current = new Date()
    return sortedTransactions.reduce(
      (summary, transaction) => {
        if (!isSameMonth(new Date(transaction.createdAt), current)) {
          return summary
        }
        if (transaction.type === 'income') {
          summary.income += transaction.amount
        } else if (transaction.type === 'expense') {
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
        summary: ReturnType<typeof formatDaySummary>
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
          summary: formatDaySummary(transaction.createdAt),
          income: transaction.type === 'income' ? transaction.amount : 0,
          expense: transaction.type === 'expense' ? transaction.amount : 0,
          items: [transaction],
        })
        return groups
      }

      existing.items.push(transaction)
      if (transaction.type === 'income') {
        existing.income += transaction.amount
      } else if (transaction.type === 'expense') {
        existing.expense += transaction.amount
      }
      return groups
    }, [])
  }, [sortedTransactions])

  const currentMoment = formatDateTime(new Date().toISOString())

  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const updateAccountDraft = <K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) => {
    setAccountDraft((current) => ({ ...current, [key]: value }))
  }

  const applyAccountSelection = (accountId: string) => {
    if (draft.type === 'transfer') {
      if (accountTarget === 'from') {
        setDraft((current) => ({
          ...current,
          fromAccountId: accountId,
          toAccountId: current.toAccountId === accountId ? '' : current.toAccountId,
        }))
        setAccountTarget('to')
      } else {
        setDraft((current) => ({
          ...current,
          toAccountId: accountId,
          fromAccountId: current.fromAccountId === accountId ? '' : current.fromAccountId,
        }))
      }
      return
    }

    updateDraft('accountId', accountId)
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

    const transaction: Transaction = {
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
      transactions: [transaction, ...current.transactions],
    }))
    closeComposer()
    setActiveView('transactions')
  }

  const saveAccount = () => {
    const name = accountDraft.name.trim()
    if (!name) {
      return
    }

    const openingBalance = Number.parseFloat(accountDraft.openingBalance || '0') || 0

    setData((current) => {
      if (accountDraft.mode === 'edit' && accountDraft.id) {
        return {
          ...current,
          accounts: current.accounts.map((account) =>
            account.id === accountDraft.id ? { ...account, name, openingBalance } : account,
          ),
        }
      }

      return {
        ...current,
        accounts: [...current.accounts, { id: crypto.randomUUID(), name, openingBalance }],
      }
    })

    closeAccountEditor()
  }

  const deleteAccount = () => {
    if (!accountDraft.id) {
      return
    }

    setData((current) => ({
      ...current,
      accounts: current.accounts.filter((account) => account.id !== accountDraft.id),
      transactions: current.transactions.filter(
        (transaction) =>
          transaction.accountId !== accountDraft.id &&
          transaction.fromAccountId !== accountDraft.id &&
          transaction.toAccountId !== accountDraft.id,
      ),
    }))

    closeAccountEditor()
  }

  const renderAccountLine = (transaction: Transaction) => {
    if (transaction.type === 'transfer') {
      const fromName = accountsById[transaction.fromAccountId ?? '']?.name ?? 'Unknown'
      const toName = accountsById[transaction.toAccountId ?? '']?.name ?? 'Unknown'
      return `${fromName} -> ${toName}`
    }

    return accountsById[transaction.accountId ?? '']?.name ?? 'Unknown'
  }

  const screenTitle = activeView === 'transactions' ? 'May 2026' : 'Accounts'

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <header className="topbar">
          <div className="title-stack">
            <h1>{screenTitle}</h1>
          </div>
          {activeView === 'accounts' ? (
            <button type="button" className="icon-button" onClick={() => openAccountEditor()}>
              +
            </button>
          ) : (
            <button type="button" className="icon-button star-button">
              ☆
            </button>
          )}
        </header>

        <main className="app-content">
          {activeView === 'transactions' && (
            <section className="transactions-screen">
              <div className="summary-band">
                <div>
                  <span>Income</span>
                  <strong className="income-text">{formatCurrency(monthlySummary.income)}</strong>
                </div>
                <div>
                  <span>Expenses</span>
                  <strong className="expense-text">{formatCurrency(monthlySummary.expense)}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{formatCurrency(monthlySummary.income - monthlySummary.expense)}</strong>
                </div>
              </div>

              <div className="transaction-feed">
                {groupedTransactions.map((group) => (
                  <section className="day-section" key={group.key}>
                    <header className="day-banner">
                      <div className="day-stamp">
                        <strong>{group.summary.day}</strong>
                        <span>{group.summary.weekday}</span>
                        <small>{group.summary.monthYear}</small>
                      </div>
                      <div className="day-metrics">
                        <span className="income-text">{formatCurrency(group.income)}</span>
                        <span className="expense-text">{formatCurrency(group.expense)}</span>
                      </div>
                    </header>

                    <div className="day-items">
                      {group.items.map((transaction) => (
                        <article className="compact-transaction" key={transaction.id}>
                          <div className="compact-left">
                            <span className="compact-category">{transaction.category}</span>
                            <div>
                              <h3>{transaction.note || transaction.description || transaction.category}</h3>
                              <p>{renderAccountLine(transaction)}</p>
                            </div>
                          </div>
                          <strong className={transaction.type === 'expense' ? 'expense-text' : 'income-text'}>
                            {transaction.type === 'expense' ? '-' : '+'}
                            {formatCurrency(transaction.amount)}
                          </strong>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <button type="button" className="fab secondary-fab">
                ◎
              </button>
              <button type="button" className="fab primary-fab" onClick={() => openComposer('expense')}>
                +
              </button>
            </section>
          )}

          {activeView === 'accounts' && (
            <section className="accounts-screen">
              <div className="accounts-header-row">
                <h2>Accounts</h2>
                <button type="button" className="inline-action" onClick={() => openAccountEditor()}>
                  Add account
                </button>
              </div>

              <div className="accounts-list">
                {data.accounts.map((account) => (
                  <button type="button" className="account-list-row" key={account.id} onClick={() => openAccountEditor(account)}>
                    <span>{account.name}</span>
                    <strong>{formatCurrency(accountBalances[account.id] ?? account.openingBalance)}</strong>
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>

        <nav className="bottom-nav two-up">
          <button
            type="button"
            className={activeView === 'transactions' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('transactions')}
          >
            Trans.
          </button>
          <button
            type="button"
            className={activeView === 'accounts' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('accounts')}
          >
            Accounts
          </button>
        </nav>

        {composerOpen && (
          <section className="overlay-screen">
            <header className="overlay-header">
              <button type="button" className="back-button" onClick={closeComposer}>
                ←
              </button>
              <h2>{draft.type[0].toUpperCase() + draft.type.slice(1)}</h2>
              <button type="button" className="icon-button star-button">
                ☆
              </button>
            </header>

            <div className="overlay-body transaction-overlay">
              <div className="type-toggle compact-toggle">
                {(['income', 'expense', 'transfer'] as TransactionType[]).map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={draft.type === type ? `toggle-chip ${type}` : 'toggle-chip'}
                    onClick={() => {
                      setDraft({
                        ...emptyDraft,
                        type,
                        category: type === 'transfer' ? 'Transfer' : '',
                      })
                      setAccountTarget(type === 'transfer' ? 'from' : 'account')
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="fields-panel">
                <div className="datetime-line">
                  <span>Date</span>
                  <strong>{currentMoment.dateText}</strong>
                  <strong>{currentMoment.timeText}</strong>
                </div>

                {draft.type === 'transfer' ? (
                  <>
                    <label className="compact-field">
                      <span>From</span>
                      <button
                        type="button"
                        className={accountTarget === 'from' ? 'line-picker active' : 'line-picker'}
                        onClick={() => setAccountTarget('from')}
                      >
                        {accountsById[draft.fromAccountId]?.name ?? 'Choose account'}
                      </button>
                    </label>
                    <label className="compact-field">
                      <span>To</span>
                      <button
                        type="button"
                        className={accountTarget === 'to' ? 'line-picker active' : 'line-picker'}
                        onClick={() => setAccountTarget('to')}
                      >
                        {accountsById[draft.toAccountId]?.name ?? 'Choose account'}
                      </button>
                    </label>
                  </>
                ) : (
                  <label className="compact-field">
                    <span>Account</span>
                    <button
                      type="button"
                      className={accountTarget === 'account' ? 'line-picker active' : 'line-picker'}
                      onClick={() => setAccountTarget('account')}
                    >
                      {accountsById[draft.accountId]?.name ?? 'Choose account'}
                    </button>
                  </label>
                )}

                <label className="compact-field">
                  <span>Category</span>
                  <input
                    value={draft.category}
                    onChange={(event) => updateDraft('category', event.target.value)}
                    placeholder={draft.type === 'transfer' ? 'Transfer' : 'Category'}
                  />
                </label>

                <label className="compact-field">
                  <span>Amount</span>
                  <input
                    inputMode="decimal"
                    value={draft.amount}
                    onChange={(event) => updateDraft('amount', event.target.value)}
                    placeholder="0.00"
                  />
                </label>

                <label className="compact-field">
                  <span>Note</span>
                  <input
                    list="note-suggestions"
                    value={draft.note}
                    onChange={(event) => updateDraft('note', event.target.value)}
                    placeholder="Note"
                  />
                </label>

                <label className="compact-field description-field">
                  <span>Description</span>
                  <input
                    value={draft.description}
                    onChange={(event) => updateDraft('description', event.target.value)}
                    placeholder="Optional"
                  />
                </label>
              </div>

              <datalist id="note-suggestions">
                {noteSuggestions.map((note) => (
                  <option value={note} key={note} />
                ))}
              </datalist>

              <div className="accounts-picker-block">
                <div className="accounts-picker-head">
                  <span>Accounts</span>
                  <button type="button" className="inline-action" onClick={() => openAccountEditor()}>
                    Add
                  </button>
                </div>

                <div className="compact-account-grid">
                  {data.accounts.map((account) => {
                    const isSelected =
                      (draft.type !== 'transfer' && draft.accountId === account.id) ||
                      (draft.type === 'transfer' &&
                        ((accountTarget === 'from' && draft.fromAccountId === account.id) ||
                          (accountTarget === 'to' && draft.toAccountId === account.id)))

                    return (
                      <button
                        type="button"
                        className={isSelected ? 'compact-account-tile selected' : 'compact-account-tile'}
                        key={account.id}
                        onClick={() => applyAccountSelection(account.id)}
                      >
                        {account.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button type="button" className="save-button" onClick={saveTransaction}>
                Save
              </button>
            </div>
          </section>
        )}

        {accountEditorOpen && (
          <section className="overlay-screen">
            <header className="overlay-header">
              <button type="button" className="back-button" onClick={closeAccountEditor}>
                ←
              </button>
              <h2>{accountDraft.mode === 'edit' ? 'Edit Account' : 'Add Account'}</h2>
              <div className="header-spacer" />
            </header>

            <div className="overlay-body account-editor-body">
              <label className="editor-field">
                <span>Name</span>
                <input
                  value={accountDraft.name}
                  onChange={(event) => updateAccountDraft('name', event.target.value)}
                  placeholder="Account name"
                />
              </label>

              <label className="editor-field">
                <span>Opening amount</span>
                <input
                  inputMode="decimal"
                  value={accountDraft.openingBalance}
                  onChange={(event) => updateAccountDraft('openingBalance', event.target.value)}
                  placeholder="0.00"
                />
              </label>

              <button type="button" className="save-button" onClick={saveAccount}>
                Save account
              </button>

              {accountDraft.mode === 'edit' && (
                <button type="button" className="delete-button" onClick={deleteAccount}>
                  Delete account
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default App
