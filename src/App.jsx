import { useState, useEffect } from 'react'
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import './App.css'

const getFirebaseWriteErrorMessage = (error) => {
  const code = error?.code || ''

  if (code === 'permission-denied') {
    return 'Permission denied by Firestore rules. Allow write access.'
  }
  if (code === 'unauthenticated') {
    return 'Firestore requires sign-in. Enable Firebase Authentication or update rules.'
  }
  if (code === 'failed-precondition') {
    return 'Firestore database not properly set up.'
  }
  if (code === 'unavailable') {
    return 'Firebase service temporarily unavailable. Try again.'
  }

  return `Could not save item to Firebase (${code || 'unknown-error'}).`
}

function App() {
  const [activeTab, setActiveTab] = useState('Current')
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [items, setItems] = useState([])
  const [receipts, setReceipts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [orderConfirmModal, setOrderConfirmModal] = useState({ isOpen: false, itemId: null, name: '' })
  const [pickupConfirmModal, setPickupConfirmModal] = useState({ isOpen: false, itemId: null, name: '' })
  const [requestMoreModal, setRequestMoreModal] = useState({ isOpen: false, itemId: null, itemName: '', quantity: '', requesterName: '' })

  const [formData, setFormData] = useState({
    itemName: '',
    itemCount: '',
    category: '',
    cost: '',
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

      await addDoc(collection(db, 'inventoryItems'), {
        itemName: formData.itemName.trim(),
        itemCount: countNumber,
        category: formData.category,
        cost: Number.isFinite(costNumber) ? costNumber : 0,

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

      // Create a new item in Want status, linked to original
      const docRef = await addDoc(collection(db, 'inventoryItems'), {
        itemName: requestMoreModal.itemName,
        itemCount: quantityNum,
        category: 'Restock',
        cost: unitPrice,
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
          <button className="add-item-button" type="button" onClick={() => setIsAddFormOpen(true)}>
            + Add Item
          </button>
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

        {message && <p className="status-message">{message}</p>}

        {/* Display items */}
        {activeTab !== 'Receipts' && (
        <div className="items-list">
          {items
            .filter((item) => item.status === activeTab)
            .filter((item) => {
              const query = searchQuery.toLowerCase()
              return (
                item.itemName.toLowerCase().includes(query) ||
                (item.category || '').toLowerCase().includes(query) ||
                (item.requestedBy || '').toLowerCase().includes(query) ||
                (item.orderedBy || '').toLowerCase().includes(query) ||
                (item.notes || '').toLowerCase().includes(query)
              )
            })
            .map((item) => (
              <div key={item.id} className="item-card">
                <h3>{item.itemName}</h3>
                <p>Quantity: {item.itemCount}</p>
                <p>Category: {item.category || 'Uncategorized'}</p>
                <p>Unit Price: ${(item.cost || 0).toFixed(2)}</p>
                {(activeTab === 'Want' || activeTab === 'Ordered') && (
                  <p>Total Price: ${((item.cost || 0) * item.itemCount).toFixed(2)}</p>
                )}

                {item.requestedBy && <p>Requested By: {item.requestedBy}</p>}
                {item.orderedBy && <p>Ordered By: {item.orderedBy}</p>}
                {item.pickupConfirmedBy && <p>Picked Up By: {item.pickupConfirmedBy}</p>}

                <p>Notes: {item.notes || 'None'}</p>

                {/* Actions */}
                <div className="item-actions">
                  {activeTab === 'Current' && (
                    <button
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
                      onClick={() =>
                        setOrderConfirmModal({ isOpen: true, itemId: item.id, name: '' })
                      }
                    >
                      Mark Ordered
                    </button>
                  )}

                  {activeTab === 'Ordered' && (
                    <button
                      onClick={() =>
                        setPickupConfirmModal({ isOpen: true, itemId: item.id, name: '' })
                      }
                    >
                      Confirm Pickup
                    </button>
                  )}
                </div>
              </div>
            ))}
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

              <label htmlFor="notes">Notes (Optional)</label>
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