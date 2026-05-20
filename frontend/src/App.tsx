import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { createAdminPackage, getAdminPackages, softDeleteAdminPackage, updateAdminPackage } from './api/adminPackages'
import { getCurrentUser, login, register } from './api/auth'
import { getPackages } from './api/packages'
import { getCurrentCredits, getPurchaseHistory, purchasePackage } from './api/purchases'
import { getCreditUsages, getUnlockedFeatures } from './api/users'
import type { AuthMode, CurrentUser } from './types/auth'
import type { CreditUsageItem, PurchaseHistoryItem, UnlockedFeatureItem } from './types/dashboard'
import type { AdminPackagePayload, PackageItem } from './types/package'

const TOKEN_STORAGE_KEY = 'subscription_credit_access_token'

type ActiveSection = 'overview' | 'packages' | 'purchases' | 'features' | 'admin' | 'support'

const initialAdminForm = {
  name: '',
  description: '',
  price: '',
  credits: '',
  isActive: true,
  featureIds: '',
}

const sidebarItems: Array<{ label: string; key: ActiveSection; adminOnly?: boolean }> = [
  { label: 'Overview', key: 'overview' },
  { label: 'Packages', key: 'packages' },
  { label: 'Purchases', key: 'purchases' },
  { label: 'Feature Access', key: 'features' },
  { label: 'Admin', key: 'admin', adminOnly: true },
  { label: 'Support', key: 'support' },
]

function parseFeatureIds(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
}

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [packagesError, setPackagesError] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [purchaseLoadingById, setPurchaseLoadingById] = useState<string | null>(null)
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const [purchaseError, setPurchaseError] = useState('')
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([])
  const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false)
  const [unlockedFeatures, setUnlockedFeatures] = useState<UnlockedFeatureItem[]>([])
  const [featuresLoading, setFeaturesLoading] = useState(false)
  const [creditUsages, setCreditUsages] = useState<CreditUsageItem[]>([])
  const [creditUsagesLoading, setCreditUsagesLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState('')
  const [adminPackages, setAdminPackages] = useState<PackageItem[]>([])
  const [adminPackagesLoading, setAdminPackagesLoading] = useState(false)
  const [adminPackagesError, setAdminPackagesError] = useState('')
  const [adminPackagesMessage, setAdminPackagesMessage] = useState('')
  const [adminSubmitting, setAdminSubmitting] = useState(false)
  const [adminDeletingId, setAdminDeletingId] = useState<string | null>(null)
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null)
  const [adminForm, setAdminForm] = useState(initialAdminForm)
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const isAdmin = currentUser?.role === 'ADMIN'
  const visibleSidebarItems = sidebarItems.filter((item) => !item.adminOnly || isAdmin)

  useEffect(() => {
    setPackagesLoading(true)
    setPackagesError('')

    getPackages()
      .then((data) => {
        setPackages(data)
      })
      .catch((loadError) => {
        setPackagesError(loadError instanceof Error ? loadError.message : 'Failed to load packages.')
      })
      .finally(() => {
        setPackagesLoading(false)
      })
  }, [])

  const loadDashboard = async (activeToken: string) => {
    setBalanceLoading(true)
    setPurchaseHistoryLoading(true)
    setFeaturesLoading(true)
    setCreditUsagesLoading(true)
    setDashboardError('')

    try {
      const [credits, history, features, usages] = await Promise.all([
        getCurrentCredits(activeToken),
        getPurchaseHistory(activeToken),
        getUnlockedFeatures(activeToken),
        getCreditUsages(activeToken),
      ])

      setBalance(credits.balance)
      setPurchaseHistory(history)
      setUnlockedFeatures(features)
      setCreditUsages(usages)
    } catch (dashboardLoadError) {
      setDashboardError(
        dashboardLoadError instanceof Error ? dashboardLoadError.message : 'Failed to load dashboard data.',
      )
    } finally {
      setBalanceLoading(false)
      setPurchaseHistoryLoading(false)
      setFeaturesLoading(false)
      setCreditUsagesLoading(false)
    }
  }

  const loadAdminPackages = async (activeToken: string) => {
    setAdminPackagesLoading(true)
    setAdminPackagesError('')

    try {
      const data = await getAdminPackages(activeToken)
      setAdminPackages(data)
    } catch (adminLoadError) {
      setAdminPackagesError(adminLoadError instanceof Error ? adminLoadError.message : 'Failed to load admin packages.')
    } finally {
      setAdminPackagesLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setCurrentUser(null)
      setBalance(null)
      setPurchaseHistory([])
      setUnlockedFeatures([])
      setCreditUsages([])
      setDashboardError('')
      setAdminPackages([])
      setAdminPackagesError('')
      setAdminPackagesMessage('')
      setEditingPackageId(null)
      setAdminForm(initialAdminForm)
      setLoadingUser(false)
      return
    }

    setLoadingUser(true)
    getCurrentUser(token)
      .then(async (user) => {
        setCurrentUser(user)
        await loadDashboard(token)
        if (user.role === 'ADMIN') {
          await loadAdminPackages(token)
        } else {
          setAdminPackages([])
          setAdminPackagesError('')
          setAdminPackagesMessage('')
          setEditingPackageId(null)
          setAdminForm(initialAdminForm)
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken(null)
        setCurrentUser(null)
        setBalance(null)
        setPurchaseHistory([])
        setUnlockedFeatures([])
        setCreditUsages([])
        setAdminPackages([])
        setError('Session expired. Please log in again.')
      })
      .finally(() => {
        setLoadingUser(false)
      })
  }, [token])

  useEffect(() => {
    if (activeSection === 'admin' && !isAdmin) {
      setActiveSection('overview')
    }
  }, [activeSection, isAdmin])

  const heading = useMemo(() => {
    return mode === 'login' ? 'Sign in to your account' : 'Create your account'
  }, [mode])

  const subtitle = useMemo(() => {
    return mode === 'login'
      ? 'Use your email and password to access the credit platform.'
      : 'Register a new account to start buying credit packages.'
  }, [mode])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setPurchaseError('')
    setPurchaseMessage('')
    setSubmitting(true)

    try {
      const authResponse =
        mode === 'login'
          ? await login({ email: form.email, password: form.password })
          : await register({ name: form.name, email: form.email, password: form.password })

      localStorage.setItem(TOKEN_STORAGE_KEY, authResponse.accessToken)
      setToken(authResponse.accessToken)
      const me = await getCurrentUser(authResponse.accessToken)
      setCurrentUser(me)
      await loadDashboard(authResponse.accessToken)
      if (me.role === 'ADMIN') {
        await loadAdminPackages(authResponse.accessToken)
      }
      setSuccessMessage(mode === 'login' ? 'Login successful.' : 'Register successful.')
      setForm({ name: '', email: '', password: '' })
      setActiveSection('overview')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setCurrentUser(null)
    setBalance(null)
    setPurchaseHistory([])
    setUnlockedFeatures([])
    setCreditUsages([])
    setDashboardError('')
    setAdminPackages([])
    setAdminPackagesError('')
    setAdminPackagesMessage('')
    setEditingPackageId(null)
    setAdminForm(initialAdminForm)
    setSuccessMessage('Logged out successfully.')
    setPurchaseMessage('')
    setPurchaseError('')
    setError('')
    setMode('login')
    setActiveSection('overview')
  }

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
    setSuccessMessage('')
  }

  const handleBuyPackage = async (packageItem: PackageItem) => {
    setPurchaseError('')
    setPurchaseMessage('')

    if (!token) {
      setPurchaseError('Please login before buying a package.')
      return
    }

    setPurchaseLoadingById(packageItem.id)
    try {
      const purchaseResult = await purchasePackage(packageItem.id, token)
      setPurchaseMessage(
        `Purchased ${packageItem.name} successfully. Transaction: ${purchaseResult.transaction.transactionCode}`,
      )
      await loadDashboard(token)
    } catch (buyError) {
      setPurchaseError(buyError instanceof Error ? buyError.message : 'Failed to buy package.')
    } finally {
      setPurchaseLoadingById(null)
    }
  }

  const resetAdminForm = () => {
    setAdminForm(initialAdminForm)
    setEditingPackageId(null)
  }

  const handleEditPackage = (packageItem: PackageItem) => {
    setAdminPackagesError('')
    setAdminPackagesMessage('')
    setEditingPackageId(packageItem.id)
    setAdminForm({
      name: packageItem.name,
      description: packageItem.description ?? '',
      price: String(packageItem.price),
      credits: String(packageItem.credits),
      isActive: packageItem.isActive,
      featureIds: packageItem.features.map((feature) => feature.id).join(','),
    })
    setActiveSection('admin')
  }

  const buildAdminPayload = (): AdminPackagePayload => {
    const featureIds = parseFeatureIds(adminForm.featureIds)

    if (featureIds.some((value) => Number.isNaN(value) || value <= 0)) {
      throw new Error('Feature IDs must be positive numbers separated by commas.')
    }

    const price = Number(adminForm.price)
    const credits = Number(adminForm.credits)

    if (Number.isNaN(price) || price < 0) {
      throw new Error('Price must be a valid non-negative number.')
    }

    if (!Number.isInteger(credits) || credits < 0) {
      throw new Error('Credits must be a valid non-negative integer.')
    }

    return {
      name: adminForm.name.trim(),
      description: adminForm.description.trim(),
      price,
      credits,
      isActive: adminForm.isActive,
      featureIds,
    }
  }

  const handleAdminSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token || !isAdmin) {
      return
    }

    setAdminPackagesError('')
    setAdminPackagesMessage('')
    setAdminSubmitting(true)

    try {
      const payload = buildAdminPayload()
      if (!payload.name) {
        throw new Error('Name is required.')
      }

      if (editingPackageId) {
        await updateAdminPackage(token, editingPackageId, payload)
        setAdminPackagesMessage('Package updated successfully.')
      } else {
        await createAdminPackage(token, payload)
        setAdminPackagesMessage('Package created successfully.')
      }

      resetAdminForm()
      await loadAdminPackages(token)
      await loadPackagesPublic()
    } catch (adminSubmitError) {
      setAdminPackagesError(
        adminSubmitError instanceof Error ? adminSubmitError.message : 'Failed to save admin package.',
      )
    } finally {
      setAdminSubmitting(false)
    }
  }

  const handleSoftDeletePackage = async (packageId: string) => {
    if (!token || !isAdmin) {
      return
    }

    const confirmed = window.confirm('Are you sure you want to soft delete this package?')
    if (!confirmed) {
      return
    }

    setAdminPackagesError('')
    setAdminPackagesMessage('')
    setAdminDeletingId(packageId)

    try {
      await softDeleteAdminPackage(token, packageId)
      if (editingPackageId === packageId) {
        resetAdminForm()
      }
      setAdminPackagesMessage('Package soft deleted successfully.')
      await loadAdminPackages(token)
      await loadPackagesPublic()
    } catch (adminDeleteError) {
      setAdminPackagesError(
        adminDeleteError instanceof Error ? adminDeleteError.message : 'Failed to soft delete package.',
      )
    } finally {
      setAdminDeletingId(null)
    }
  }

  const loadPackagesPublic = async () => {
    setPackagesLoading(true)
    setPackagesError('')

    try {
      const data = await getPackages()
      setPackages(data)
    } catch (loadError) {
      setPackagesError(loadError instanceof Error ? loadError.message : 'Failed to load packages.')
    } finally {
      setPackagesLoading(false)
    }
  }

  const loginRequiredCard = (message: string) => (
    <div className="card-section muted">
      <h3>Login required</h3>
      <p>{message}</p>
    </div>
  )

  const renderOverview = () => {
    if (!currentUser) {
      return (
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nguyen Van A"
                required
              />
            </label>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="user@gmail.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="123456"
              minLength={6}
              required
            />
          </label>

          {error && <div className="message error">{error}</div>}
          {successMessage && <div className="message success">{successMessage}</div>}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      )
    }

    return (
      <>
        <section className="overview-grid">
          <div className="card-section overview-current-user">
            <div className="card-title-row">
              <div>
                <h3>Current user</h3>
                <p>Keep your active session visible while working.</p>
              </div>
              <button type="button" className="primary-button logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>

            <dl className="user-grid">
              <div>
                <dt>Name</dt>
                <dd>{currentUser.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{currentUser.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{currentUser.role}</dd>
              </div>
              <div>
                <dt>User ID</dt>
                <dd>{currentUser.id}</dd>
              </div>
            </dl>
          </div>

          <div className="card-section overview-stat-card">
            <span>Current credits</span>
            <strong>{balanceLoading ? 'Refreshing...' : balance ?? 0}</strong>
            <p>Live balance for package purchases and feature usage.</p>
          </div>

          <div className="card-section overview-stat-card">
            <span>Unlocked features</span>
            <strong>{featuresLoading ? '...' : unlockedFeatures.length}</strong>
            <p>Features currently available in this account.</p>
          </div>

          <div className="card-section overview-stat-card">
            <span>Purchases</span>
            <strong>{purchaseHistoryLoading ? '...' : purchaseHistory.length}</strong>
            <p>Completed purchases recorded in your history.</p>
          </div>
        </section>
      </>
    )
  }

  const renderPackages = () => (
    <section className="packages-section">
      <div className="card-title-row">
        <div>
          <h3>Available packages</h3>
          <p>Browse active packages and buy credits instantly.</p>
        </div>
      </div>

      {packagesLoading ? (
        <div className="card-section muted">Loading packages...</div>
      ) : (
        <div className="packages-grid">
          {packages.map((packageItem) => (
            <article key={packageItem.id} className="package-card">
              <div className="package-card-content">
                <div className="package-top">
                  <div>
                    <h4>{packageItem.name}</h4>
                    <p>{packageItem.description ?? 'No description provided.'}</p>
                  </div>
                  <span className="price-badge">{packageItem.price.toLocaleString()} VND</span>
                </div>

                <div className="package-meta">
                  <div>
                    <span>Credits</span>
                    <strong>{packageItem.credits}</strong>
                  </div>
                  <div>
                    <span>Features</span>
                    <strong>{packageItem.features.length}</strong>
                  </div>
                </div>

                <ul className="feature-list">
                  {packageItem.features.map((feature) => (
                    <li key={feature.id}>{feature.name}</li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="primary-button package-buy-button"
                disabled={purchaseLoadingById === packageItem.id}
                onClick={() => handleBuyPackage(packageItem)}
              >
                {purchaseLoadingById === packageItem.id ? 'Buying...' : 'Buy package'}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )

  const renderPurchases = () => {
    if (!currentUser) {
      return loginRequiredCard('Please login to view your purchase history.')
    }

    return (
      <section className="dashboard-card">
        <div className="card-title-row compact">
          <div>
            <h3>Purchase history</h3>
            <p>Latest purchases first.</p>
          </div>
        </div>
        {purchaseHistoryLoading ? (
          <p className="empty-state">Loading purchase history...</p>
        ) : purchaseHistory.length === 0 ? (
          <p className="empty-state">No purchase history yet.</p>
        ) : (
          <div className="stack-list">
            {purchaseHistory.map((item) => (
              <article key={item.id} className="dashboard-item">
                <div className="dashboard-item-header">
                  <strong>{item.transactionCode}</strong>
                  <span>{item.status}</span>
                </div>
                <p>Package ID: {item.packageId ?? 'N/A'}</p>
                <p>Amount: {item.amount.toLocaleString()} VND</p>
                <p>Credits: {item.credits}</p>
                <p>Payment: {item.paymentMethod ?? 'N/A'}</p>
                <p>Created: {item.createdAt ?? 'N/A'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  const renderFeatures = () => {
    if (!currentUser) {
      return loginRequiredCard('Please login to view unlocked features and credit usage.')
    }

    return (
      <div className="dashboard-grid features-tab-grid">
        <section className="dashboard-card">
          <div className="card-title-row compact">
            <div>
              <h3>Unlocked features</h3>
              <p>Features available in your account.</p>
            </div>
          </div>
          {featuresLoading ? (
            <p className="empty-state">Loading unlocked features...</p>
          ) : unlockedFeatures.length === 0 ? (
            <p className="empty-state">No unlocked features yet.</p>
          ) : (
            <div className="stack-list">
              {unlockedFeatures.map((item) => (
                <article key={item.id} className="dashboard-item">
                  <div className="dashboard-item-header">
                    <strong>{item.code}</strong>
                    <span>{item.name}</span>
                  </div>
                  <p>{item.description ?? 'No description provided.'}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-card full-width">
          <div className="card-title-row compact">
            <div>
              <h3>Credit usage history</h3>
              <p>Track how credits were consumed.</p>
            </div>
          </div>
          {creditUsagesLoading ? (
            <p className="empty-state">Loading credit usage history...</p>
          ) : creditUsages.length === 0 ? (
            <p className="empty-state">No credit usage history yet.</p>
          ) : (
            <div className="stack-list">
              {creditUsages.map((item) => (
                <article key={item.id} className="dashboard-item horizontal">
                  <div>
                    <strong>{item.featureCode}</strong>
                    <p>{item.description ?? 'No description provided.'}</p>
                  </div>
                  <div className="usage-meta">
                    <span>{item.creditsUsed} credits</span>
                    <small>{item.createdAt ?? 'N/A'}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    )
  }

  const renderAdmin = () => {
    if (!currentUser) {
      return loginRequiredCard('Please login as admin to manage packages.')
    }

    if (!isAdmin) {
      return loginRequiredCard('Admin access required for package management.')
    }

    return (
      <section className="packages-section admin-packages-section">
        <div className="card-title-row">
          <div>
            <h3>Admin Packages</h3>
            <p>Manage all packages, including inactive ones.</p>
          </div>
        </div>

        <form className="admin-package-form" onSubmit={handleAdminSubmit}>
          <div className="admin-form-header">
            <div>
              <h4>{editingPackageId ? 'Update package' : 'Create package'}</h4>
              <p>Keep package info tidy, then save to refresh the admin list below.</p>
            </div>
            <span className={`status-pill ${adminForm.isActive ? 'active' : 'inactive'}`}>
              {adminForm.isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>

          <div className="admin-form-grid">
            <label>
              <span>Name</span>
              <small>Short package title shown to users.</small>
              <input
                value={adminForm.name}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Premium package"
                required
              />
            </label>

            <label>
              <span>Price</span>
              <small>Use VND value, example 199000.</small>
              <input
                type="number"
                min="0"
                step="0.01"
                value={adminForm.price}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="199000"
                required
              />
            </label>

            <label>
              <span>Credits</span>
              <small>Total credits granted after purchase.</small>
              <input
                type="number"
                min="0"
                step="1"
                value={adminForm.credits}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, credits: event.target.value }))}
                placeholder="500"
                required
              />
            </label>

            <label>
              <span>Feature IDs</span>
              <small>Comma-separated list, for example 1,2,3.</small>
              <input
                value={adminForm.featureIds}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, featureIds: event.target.value }))}
                placeholder="1,2,3"
              />
            </label>

            <label className="admin-form-full">
              <span>Description</span>
              <small>Optional short description for the package card.</small>
              <input
                value={adminForm.description}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Describe the package"
              />
            </label>
          </div>

          <div className="admin-form-footer">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={adminForm.isActive}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              <span>Package is active</span>
            </label>

            <div className="admin-actions-row">
              <button type="submit" className="primary-button" disabled={adminSubmitting}>
                {adminSubmitting ? 'Saving...' : editingPackageId ? 'Save update' : 'Create'}
              </button>
              {editingPackageId && (
                <button type="button" className="secondary-button" onClick={resetAdminForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        {adminPackagesMessage && <div className="message success">{adminPackagesMessage}</div>}
        {adminPackagesError && <div className="message error">{adminPackagesError}</div>}

        {adminPackagesLoading ? (
          <p className="empty-state">Loading admin packages...</p>
        ) : adminPackages.length === 0 ? (
          <p className="empty-state">No admin packages found.</p>
        ) : (
          <div className="stack-list">
            {adminPackages.map((packageItem) => (
              <article key={packageItem.id} className="dashboard-item admin-package-item">
                <div className="dashboard-item-header admin-package-top">
                  <div>
                    <small className="admin-package-id">Package #{packageItem.id}</small>
                    <strong>{packageItem.name}</strong>
                  </div>
                  <span className={`status-pill ${packageItem.isActive ? 'active' : 'inactive'}`}>
                    {packageItem.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <p className="admin-package-description">{packageItem.description ?? 'No description provided.'}</p>

                <div className="admin-package-meta">
                  <div>
                    <span>Price</span>
                    <strong>{packageItem.price.toLocaleString()} VND</strong>
                  </div>
                  <div>
                    <span>Credits</span>
                    <strong>{packageItem.credits}</strong>
                  </div>
                  <div>
                    <span>Features</span>
                    <strong>{packageItem.features.length}</strong>
                  </div>
                  <div>
                    <span>Visible</span>
                    <strong>{packageItem.isActive ? 'Yes' : 'No'}</strong>
                  </div>
                </div>

                <div className="admin-feature-wrap">
                  {packageItem.features.length > 0 ? (
                    packageItem.features.map((feature) => (
                      <span key={feature.id} className="feature-chip">
                        #{feature.id} {feature.name}
                      </span>
                    ))
                  ) : (
                    <span className="feature-chip muted">No features</span>
                  )}
                </div>

                <div className="admin-item-actions">
                  <button type="button" className="secondary-button" onClick={() => handleEditPackage(packageItem)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    disabled={adminDeletingId === packageItem.id}
                    onClick={() => handleSoftDeletePackage(packageItem.id)}
                  >
                    {adminDeletingId === packageItem.id ? 'Deleting...' : 'Soft delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  const renderSupport = () => (
    <section className="card-section support-tab-card">
      <div className="card-title-row">
        <div>
          <h3>Support</h3>
          <p>Quick guidance for using this credit platform.</p>
        </div>
      </div>
      <ul className="support-list">
        <li>Overview shows your current account snapshot and credits.</li>
        <li>Packages lets guests browse and signed-in users buy credits.</li>
        <li>Purchases shows your transaction history after login.</li>
        <li>Feature Access shows unlocked features and credit usage history.</li>
        <li>Admin is available only for ADMIN accounts.</li>
      </ul>
    </section>
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview()
      case 'packages':
        return renderPackages()
      case 'purchases':
        return renderPurchases()
      case 'features':
        return renderFeatures()
      case 'admin':
        return renderAdmin()
      case 'support':
        return renderSupport()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="app-shell">
      <div className="app-card dashboard-layout">
        <aside className="sidebar-panel">
          <div className="sidebar-brand">
            <p className="eyebrow">Control Center</p>
          </div>

          <nav className="sidebar-nav" aria-label="Dashboard sections">
            {visibleSidebarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sidebar-link sidebar-tab ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => setActiveSection(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="main-panel">
          <header className="top-header">
            <div>
              <p className="eyebrow">Dashboard workspace</p>
              <h2>{heading}</h2>
              <p className="top-header-copy">{subtitle}</p>
            </div>

            <div className="mode-switch">
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => switchMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={mode === 'register' ? 'active' : ''}
                onClick={() => switchMode('register')}
              >
                Register
              </button>
            </div>
          </header>

          {!loadingUser && currentUser && successMessage && <div className="message success">{successMessage}</div>}
          {purchaseMessage && <div className="message success">{purchaseMessage}</div>}
          {purchaseError && <div className="message error">{purchaseError}</div>}
          {packagesError && <div className="message error">{packagesError}</div>}
          {dashboardError && <div className="message error">{dashboardError}</div>}

          {loadingUser ? <div className="card-section muted">Loading current session...</div> : renderActiveSection()}
        </section>

        <aside className="info-panel hero-side-panel">
          <div className="hero-side-content">
            <p className="eyebrow">SUBSCRIPTION CREDIT SYSTEM</p>
            <h3>User dashboard and package purchase demo</h3>
            <p className="hero-side-copy">
              Frontend React app connected to the NestJS backend at <code>http://localhost:3000</code>.
            </p>

            <div className="hero-side-inner-card session-info-card">
              <div className="session-chip">
                <span className={`status-dot ${token ? 'online' : 'offline'}`} />
                <div>
                  <strong>{token ? 'Session detected' : 'No active session'}</strong>
                  <p>{token ? 'Current session is active and synced.' : 'Login to sync dashboard data.'}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App
