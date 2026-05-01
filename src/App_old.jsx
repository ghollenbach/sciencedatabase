import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public route - Landing page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Protected routes - Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
  const [requestMoreModal, setRequestMoreModal] = useState({ isOpen: false, itemId: null, itemName: '', quantity: '', requesterName: '' })

  const [formData, setFormData] = useState({
    itemName: '',
    itemCount: '',
    category: '',
    cost: '',
    department: '',
    course: '',
    storageLocation: '',
    vendor: '',
    requestedBy: '',
    orderedBy: '',
    pickupConfirmedBy: '',
    notes: '',
  })

  const tabs = ['Current', 'Want', 'Ordered', 'Receipts']

  // Handle form input changes
  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const clearForm = () => {
    setFormData({
      itemName: '',
      itemCount: '',
      category: '',
      cost: '',
      department: '',
      course: '',
      storageLocation: '',
      vendor: '',
      requestedBy: '',
      orderedBy: '',
      pickupConfirmedBy: '',
      notes: '',
    })
  }

  // Add item to Firestore
  const handleAddItem = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!formData.itemName.trim()) {
      setMessage('Item name is required.')
      return
    }

    const countNumber = Number(formData.itemCount)
    const costNumber = Number(formData.cost)

    if (!Number.isFinite(countNumber) || countNumber < 0) {
      setMessage('Item count must be a valid number.')
      return
    }

    try {
      setIsSaving(true)

      const normalizedItemName = formData.itemName.trim().toLowerCase()
      const normalizedStorageLocation = formData.storageLocation.trim().toLowerCase()
      const matchingItems = items.filter(
        (item) =>
          item.status === activeTab &&
          item.itemName?.trim().toLowerCase() === normalizedItemName &&
          (item.storageLocation || '').trim().toLowerCase() === normalizedStorageLocation
      )

      if (matchingItems.length > 0) {
        const [primaryItem, ...duplicateItems] = matchingItems
        const combinedCount = matchingItems.reduce(
          (total, item) => total + Number(item.itemCount || 0),
          countNumber
        )

        await updateDoc(doc(db, 'inventoryItems', primaryItem.id), {
          itemCount: combinedCount,
          category: formData.category,
          cost: Number.isFinite(costNumber) ? costNumber : 0,
          department: formData.department.trim(),
          course: formData.course.trim(),
          vendor: formData.vendor.trim(),
          requestedBy: formData.requestedBy.trim(),
          orderedBy: formData.orderedBy.trim(),
          pickupConfirmedBy: formData.pickupConfirmedBy.trim(),
          notes: formData.notes.trim(),
        })

        await Promise.all(duplicateItems.map((item) => deleteDoc(doc(db, 'inventoryItems', item.id))))

        clearForm()
        setIsAddFormOpen(false)
        setMessage('Matching items combined successfully.')
        return
      }

      await addDoc(collection(db, 'inventoryItems'), {
        itemName: formData.itemName.trim(),
        itemCount: countNumber,
        category: formData.category,
        cost: Number.isFinite(costNumber) ? costNumber : 0,
        department: formData.department.trim(),
        course: formData.course.trim(),
        storageLocation: formData.storageLocation.trim(),
        vendor: formData.vendor.trim(),

        requestedBy: formData.requestedBy.trim(),
        orderedBy: formData.orderedBy.trim(),
        pickupConfirmedBy: formData.pickupConfirmedBy.trim(),

        status: activeTab,

        requestDate: serverTimestamp(),
        orderDate: null,
        pickupDate: null,

        notes: formData.notes.trim(),
      })

      clearForm()
      setIsAddFormOpen(false)
      setMessage('Item added successfully.')
    } catch (error) {
      setMessage(getFirebaseWriteErrorMessage(error))
      console.error('Firebase add item error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Fetch items in real time
  useEffect(() => {
    const q = query(collection(db, 'inventoryItems'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setItems(itemList)
    })

    return () => unsubscribe()
  }, [])

  // Fetch receipts in real time
  useEffect(() => {
    const q = query(collection(db, 'receipts'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const receiptList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      // Sort by timestamp descending (newest first)
      receiptList.sort((a, b) => (b.timestamp?.toDate?.() || 0) - (a.timestamp?.toDate?.() || 0))
      setReceipts(receiptList)
    })

    return () => unsubscribe()
  }, [])

  // Log activity to receipts
  const logActivity = async (action, itemId, itemName, details = {}) => {
    try {
      await addDoc(collection(db, 'receipts'), {
        action,
        itemId,
        itemName,
        details,
        timestamp: serverTimestamp(),
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }

  // Update item status
  const updateStatus = async (id, newStatus) => {
    const ref = doc(db, 'inventoryItems', id)

    await updateDoc(ref, {
      status: newStatus,
    })
  }

  // Request item
  const requestItem = async (id, requester) => {
    const ref = doc(db, 'inventoryItems', id)

    await updateDoc(ref, {
      status: 'Ordered',
      requestedBy: requester,
      requestDate: serverTimestamp(),
    })
  }

  // Order item
  const orderItem = async (id, orderedBy) => {
    const ref = doc(db, 'inventoryItems', id)

    await updateDoc(ref, {
      status: 'Ordered',
      orderedBy: orderedBy,
      orderDate: serverTimestamp(),
    })
  }

  // Confirm pickup
  const confirmPickup = async (id, name) => {
    const ref = doc(db, 'inventoryItems', id)
    const itemSnap = await getDocs(query(collection(db, 'inventoryItems'), where('__name__', '==', id)))
    const itemData = itemSnap.docs[0]?.data()

    // Check if this is a restock request (has linkedItemId)
    if (itemData?.linkedItemId) {
      // Add quantity to original item
      const origRef = doc(db, 'inventoryItems', itemData.linkedItemId)
      const origSnap = await getDocs(query(collection(db, 'inventoryItems'), where('__name__', '==', itemData.linkedItemId)))
      const origData = origSnap.docs[0]?.data()

      if (origData) {
        await updateDoc(origRef, {
          itemCount: origData.itemCount + itemData.itemCount,
        })
        // Log the restock completion
        await logActivity('RESTOCK_COMPLETED', itemData.linkedItemId, origData.itemName, {
          addedQuantity: itemData.itemCount,
          newTotal: origData.itemCount + itemData.itemCount,
          pickedUpBy: name,
        })
      }

      // Update the restock request to Current status
      await updateDoc(ref, {
        status: 'Current',
        pickupConfirmedBy: name,
        pickupDate: serverTimestamp(),
      })
      // Log the pickup
      await logActivity('PICKUP_CONFIRMED', id, itemData.itemName, {
        pickedUpBy: name,
        quantity: itemData.itemCount,
      })
    } else {
      // Normal pickup confirmation
      await updateDoc(ref, {
        status: 'Current',
        pickupConfirmedBy: name,
        pickupDate: serverTimestamp(),
      })
      // Log the pickup
      await logActivity('PICKUP_CONFIRMED', id, itemData?.itemName || 'Unknown', {
        pickedUpBy: name,
      })
    }
  }

  // Handle mark ordered submission
  const handleSubmitOrderConfirm = async () => {
    if (!orderConfirmModal.name.trim()) {
      setMessage('Please enter who ordered the item.')
      return
    }

    try {
      setIsSaving(true)
      await orderItem(orderConfirmModal.itemId, orderConfirmModal.name.trim())
      setOrderConfirmModal({ isOpen: false, itemId: null, name: '' })
      setMessage('Item marked as ordered.')
    } catch (error) {
      setMessage('Failed to mark item as ordered.')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle pickup confirmation submission
  const handleSubmitPickupConfirm = async () => {
    if (!pickupConfirmModal.name.trim()) {
      setMessage('Please enter who received the item.')
      return
    }

    try {
      setIsSaving(true)
      await confirmPickup(pickupConfirmModal.itemId, pickupConfirmModal.name.trim())
      setPickupConfirmModal({ isOpen: false, itemId: null, name: '' })
      setMessage('Item marked as received.')
    } catch (error) {
      setMessage('Failed to mark item as received.')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle request more submission
  const handleSubmitRequestMore = async () => {
    if (!requestMoreModal.quantity.trim()) {
      setMessage('Please enter quantity to request.')
      return
    }

    if (!requestMoreModal.requesterName.trim()) {
      setMessage('Please enter who is requesting.')
      return
    }

    const quantityNum = Number(requestMoreModal.quantity)
    if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
      setMessage('Quantity must be a valid positive number.')
      return
    }

    try {
      setIsSaving(true)

      // Get the original item to copy unit price
      const originalItem = items.find((item) => item.id === requestMoreModal.itemId)
      const unitPrice = originalItem?.cost || 0
      const originalDepartment = originalItem?.department || ''
      const originalCourse = originalItem?.course || ''
      const originalStorageLocation = originalItem?.storageLocation || ''
      const originalVendor = originalItem?.vendor || ''

      // Create a new item in Want status, linked to original
      await addDoc(collection(db, 'inventoryItems'), {
        itemName: requestMoreModal.itemName,
        itemCount: quantityNum,
        category: 'Restock',
        cost: unitPrice,
        department: originalDepartment,
        course: originalCourse,
        storageLocation: originalStorageLocation,
        vendor: originalVendor,
        status: 'Want',
        linkedItemId: requestMoreModal.itemId, // Link to original item
        requestedBy: requestMoreModal.requesterName.trim(),
        orderedBy: '',
        pickupConfirmedBy: '',
        notes: `Restock request for existing item`,
        requestDate: serverTimestamp(),
        orderDate: null,
        pickupDate: null,
      })

      // Log the restock request
      await logActivity('RESTOCK_REQUESTED', requestMoreModal.itemId, requestMoreModal.itemName, {
        quantity: quantityNum,
        requestedBy: requestMoreModal.requesterName.trim(),
      })

      setRequestMoreModal({ isOpen: false, itemId: null, itemName: '', quantity: '', requesterName: '' })
      setMessage('Restock request created.')
    } catch (error) {
      setMessage('Failed to create restock request.')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete item (available in any non-Receipts tab)
  const handleDeleteItem = async (itemId, itemName) => {
    const confirmed = window.confirm(`Delete "${itemName}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      setIsSaving(true)
      await deleteDoc(doc(db, 'inventoryItems', itemId))
      await logActivity('ITEM_DELETED', itemId, itemName, {})
      setMessage('Item deleted successfully.')
    } catch (error) {
      setMessage(getFirebaseWriteErrorMessage(error))
      console.error('Firebase delete item error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const escapeCsvValue = (value) => {
    const stringValue = value == null ? '' : String(value)
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  const downloadCsv = (filename, headers, rows) => {
    const csvLines = [headers.map(escapeCsvValue).join(',')]
    rows.forEach((row) => {
      csvLines.push(row.map(escapeCsvValue).join(','))
    })

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const filteredItems = items
    .filter((item) => item.status === activeTab)
    .filter((item) => {
      const query = searchQuery.toLowerCase()
      return (
        item.itemName.toLowerCase().includes(query) ||
        (item.category || '').toLowerCase().includes(query) ||
        (item.department || '').toLowerCase().includes(query) ||
        (item.course || '').toLowerCase().includes(query) ||
        (item.storageLocation || '').toLowerCase().includes(query) ||
        (item.vendor || '').toLowerCase().includes(query) ||
        (item.requestedBy || '').toLowerCase().includes(query) ||
        (item.orderedBy || '').toLowerCase().includes(query) ||
        (item.notes || '').toLowerCase().includes(query)
      )
    })
    .filter((item) => {
      if (filters.category && item.category !== filters.category) return false
      if (filters.department && item.department !== filters.department) return false
      if (filters.course && item.course !== filters.course) return false
      return true
    })

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      department: '',
      course: '',
    })
    setSearchQuery('')
  }

  const uniqueValues = (key) => {
    const values = items
      .map((item) => item[key])
      .filter((value) => typeof value === 'string' && value.trim() !== '')
    return [...new Set(values)].sort((a, b) => a.localeCompare(b))
  }

  const handleExportReport = () => {
    if (activeTab === 'Receipts') {
      if (!receipts.length) {
        setMessage('No receipt data to export.')
        return
      }

      const rows = receipts.map((receipt) => [
        receipt.action || '',
        receipt.itemName || '',
        receipt.timestamp?.toDate?.().toLocaleString() || '',
        JSON.stringify(receipt.details || {}),
      ])

      downloadCsv(
        `science-inventory-receipts-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Action', 'Item Name', 'Timestamp', 'Details'],
        rows
      )
      setMessage('Receipt report exported.')
      return
    }

    if (!filteredItems.length) {
      setMessage('No inventory data to export for current filters.')
      return
    }

    const rows = filteredItems.map((item) => [
      item.itemName,
      item.itemCount,
      item.category || '',
      item.department || '',
      item.course || '',
      item.storageLocation || '',
      item.vendor || '',
      item.cost || 0,
      (item.cost || 0) * (item.itemCount || 0),
      item.requestedBy || '',
      item.orderedBy || '',
      item.pickupConfirmedBy || '',
      item.notes || '',
      item.status || '',
    ])

    downloadCsv(
      `science-inventory-${activeTab.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Item Name',
        'Quantity',
        'Category',
        'Department',
        'Course',
        'Storage Location',
        'Vendor',
        'Unit Price',
        'Total Price',
        'Requested By',
        'Ordered By',
        'Picked Up By',
        'Teacher Notes',
        'Status',
      ],
      rows
    )
    setMessage('Inventory report exported.')
  }

  return (
    <div className="App">
      <header className="page-header">
        <h1>Science Department Inventory</h1>
      </header>

      <nav className="tabs" aria-label="Inventory sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab${activeTab === tab ? ' is-active' : ''}`}
            type="button"
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="content">
        <div className="toolbar">
          <h2>{activeTab} Items</h2>
          <div className="toolbar-actions">
            <button className="export-button" type="button" onClick={handleExportReport}>
              Export Report
            </button>
            {activeTab !== 'Receipts' && (
              <button className="add-item-button" type="button" onClick={() => setIsAddFormOpen(true)}>
                + Add Item
              </button>
            )}
          </div>
        </div>

        <div className="search-row">
          <input
            className="search-input"
            type="text"
            placeholder="Search here..."
            aria-label={`Search ${activeTab} inventory`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-button" type="button" aria-label="Clear search" onClick={() => setSearchQuery('')}>
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {activeTab !== 'Receipts' && (
          <div className="filters-row" aria-label="Item filters">
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {uniqueValues('category').map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <select name="department" value={filters.department} onChange={handleFilterChange}>
              <option value="">All Departments</option>
              {uniqueValues('department').map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <select name="course" value={filters.course} onChange={handleFilterChange}>
              <option value="">All Courses</option>
              {uniqueValues('course').map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <button type="button" className="secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        )}

        {message && <p className="status-message">{message}</p>}

        {/* Display items */}
        {activeTab !== 'Receipts' && (
          <div className="items-list">
            {filteredItems.length === 0 ? (
              <p className="no-receipts">No items match current filters.</p>
            ) : (
              <div className="table-wrap">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Category</th>
                      <th>Department</th>
                      <th>Course</th>
                      <th>Location</th>
                      <th>Vendor</th>
                      <th>Unit Price</th>
                      {(activeTab === 'Want' || activeTab === 'Ordered') && <th>Total Price</th>}
                      <th>Requested By</th>
                      <th>Ordered By</th>
                      <th>Picked Up By</th>
                      <th>Teacher Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.itemName}</td>
                        <td>{item.itemCount}</td>
                        <td>{item.category || 'Uncategorized'}</td>
                        <td>{item.department || 'Unspecified'}</td>
                        <td>{item.course || 'Unspecified'}</td>
                        <td>{item.storageLocation || 'Unspecified'}</td>
                        <td>{item.vendor || 'Unspecified'}</td>
                        <td>${(item.cost || 0).toFixed(2)}</td>
                        {(activeTab === 'Want' || activeTab === 'Ordered') && (
                          <td>${((item.cost || 0) * item.itemCount).toFixed(2)}</td>
                        )}
                        <td>{item.requestedBy || '-'}</td>
                        <td>{item.orderedBy || '-'}</td>
                        <td>{item.pickupConfirmedBy || '-'}</td>
                        <td className="notes-cell">{item.notes || 'None'}</td>
                        <td>
                          <div className="row-actions">
                            {activeTab === 'Current' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRequestMoreModal({
                                    isOpen: true,
                                    itemId: item.id,
                                    itemName: item.itemName,
                                    quantity: '',
                                    requesterName: '',
                                  })
                                }
                              >
                                Request More
                              </button>
                            )}

                            {activeTab === 'Want' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setOrderConfirmModal({ isOpen: true, itemId: item.id, name: '' })
                                }
                              >
                                Mark Ordered
                              </button>
                            )}

                            {activeTab === 'Ordered' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPickupConfirmModal({ isOpen: true, itemId: item.id, name: '' })
                                }
                              >
                                Confirm Pickup
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id, item.itemName)}
                              disabled={isSaving}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Receipts tab */}
        {activeTab === 'Receipts' && (
          <div className="receipts-list">
            {receipts.length === 0 ? (
              <p className="no-receipts">No activity recorded yet.</p>
            ) : (
              receipts.map((receipt) => (
                <div key={receipt.id} className="receipt-card">
                  <div className="receipt-header">
                    <h4 className={`receipt-action action-${receipt.action.toLowerCase()}`}>
                      {receipt.action.replace(/_/g, ' ')}
                    </h4>
                    <span className="receipt-time">
                      {receipt.timestamp?.toDate?.().toLocaleString() || 'Unknown time'}
                    </span>
                  </div>
                  <p><strong>Item:</strong> {receipt.itemName}</p>
                  {receipt.details && (
                    <details className="receipt-details">
                      <summary>Details</summary>
                      <pre>{JSON.stringify(receipt.details, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Add item modal */}
        {isAddFormOpen && (
          <div className="add-form-modal" role="dialog" aria-modal="true" aria-label="Add inventory item">
            <form className="add-form" onSubmit={handleAddItem}>
              <h3>Add Item to {activeTab}</h3>

              <label htmlFor="itemName">Item Name</label>
              <input
                id="itemName"
                name="itemName"
                type="text"
                value={formData.itemName}
                onChange={handleChange}
                required
              />

              <label htmlFor="itemCount">Item Count</label>
              <input
                id="itemCount"
                name="itemCount"
                type="number"
                min="0"
                value={formData.itemCount}
                onChange={handleChange}
                required
              />

              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="Glassware">Glassware</option>
                <option value="Chemicals">Chemicals</option>
                <option value="Equipment">Equipment</option>
                <option value="Consumables">Consumables</option>
                <option value="Other">Other</option>
              </select>

              <label htmlFor="unitPrice">Unit Price ($)</label>
              <input
                id="unitPrice"
                name="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={handleChange}
              />

              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Chemistry"
              />

              <label htmlFor="course">Course</label>
              <input
                id="course"
                name="course"
                type="text"
                value={formData.course}
                onChange={handleChange}
                placeholder="e.g. Biology 101"
              />

              <label htmlFor="storageLocation">Storage Location</label>
              <input
                id="storageLocation"
                name="storageLocation"
                type="text"
                value={formData.storageLocation}
                onChange={handleChange}
                placeholder="e.g. Lab Cabinet A"
              />

              <label htmlFor="vendor">Vendor</label>
              <input
                id="vendor"
                name="vendor"
                type="text"
                value={formData.vendor}
                onChange={handleChange}
                placeholder="e.g. Fisher Scientific"
              />

              <label htmlFor="requestedBy">Requested By</label>
              <input
                id="requestedBy"
                name="requestedBy"
                type="text"
                value={formData.requestedBy}
                onChange={handleChange}
              />

              <label htmlFor="orderedBy">Ordered By</label>
              <input
                id="orderedBy"
                name="orderedBy"
                type="text"
                value={formData.orderedBy}
                onChange={handleChange}
              />

              <label htmlFor="pickupConfirmedBy">Pickup Confirmed By</label>
              <input
                id="pickupConfirmedBy"
                name="pickupConfirmedBy"
                type="text"
                value={formData.pickupConfirmedBy}
                onChange={handleChange}
              />

              <label htmlFor="notes">Teacher Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
              />

              <div className="form-actions">
                <button type="button" className="secondary" onClick={() => setIsAddFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* Order confirmation modal */}
      {orderConfirmModal.isOpen && (
        <div
          className="add-form-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm who ordered the item"
        >
          <div className="add-form">
            <h3>Who Ordered This Item?</h3>

            <label htmlFor="orderedByName">Enter your name</label>
            <input
              id="orderedByName"
              type="text"
              value={orderConfirmModal.name}
              onChange={(e) =>
                setOrderConfirmModal((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Your name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitOrderConfirm()
              }}
            />

            <div className="form-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setOrderConfirmModal({ isOpen: false, itemId: null, name: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleSubmitOrderConfirm}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup confirmation modal */}
      {pickupConfirmModal.isOpen && (
        <div
          className="add-form-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm who received the item"
        >
          <div className="add-form">
            <h3>Who Received This Item?</h3>

            <label htmlFor="pickedUpByName">Enter your name</label>
            <input
              id="pickedUpByName"
              type="text"
              value={pickupConfirmModal.name}
              onChange={(e) =>
                setPickupConfirmModal((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Your name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitPickupConfirm()
              }}
            />

            <div className="form-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setPickupConfirmModal({ isOpen: false, itemId: null, name: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleSubmitPickupConfirm}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Confirm Pickup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request more modal */}
      {requestMoreModal.isOpen && (
        <div
          className="add-form-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Request more of an item"
        >
          <div className="add-form">
            <h3>Request More: {requestMoreModal.itemName}</h3>

            <label htmlFor="requestQuantity">How many do you need?</label>
            <input
              id="requestQuantity"
              type="number"
              min="1"
              value={requestMoreModal.quantity}
              onChange={(e) =>
                setRequestMoreModal((prev) => ({ ...prev, quantity: e.target.value }))
              }
              placeholder="Quantity"
            />

            <label htmlFor="requesterName">Who is requesting?</label>
            <input
              id="requesterName"
              type="text"
              value={requestMoreModal.requesterName}
              onChange={(e) =>
                setRequestMoreModal((prev) => ({ ...prev, requesterName: e.target.value }))
              }
              placeholder="Your name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitRequestMore()
              }}
            />

            <div className="form-actions">
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setRequestMoreModal({ isOpen: false, itemId: null, itemName: '', quantity: '', requesterName: '' })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleSubmitRequestMore}
                disabled={isSaving}
              >
                {isSaving ? 'Creating...' : 'Create Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App