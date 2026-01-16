# Tracker Recipients (Actions) Feature - Refactored

## Overview

The refactored structure combines the tracker-recipient junction table with action tracking. Each tracker-recipient relationship now includes:

- **Status**: pending, seen, read, acknowledged, action_required, completed
- **Timestamps**: When each action was taken
- **Action**: Specific action assigned to recipient
- **Remarks**: Notes or comments from recipients

## Database Schema

### tracker_recipients Table

```sql
CREATE TABLE tracker_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'pending',
  seen_at TIMESTAMP,
  read_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  "action" VARCHAR(255),
  remarks TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE,
  UNIQUE(tracker_id, recipient_id)
);
```

## API Response Structure

Tracker endpoints now return nested recipient data with actions:

```json
{
  "id": "tracker-uuid",
  "serialNumber": "2026-01-DTS2-00000001",
  "documentTitle": "Sample Document",
  "fromName": "LCE Office",
  "trackerRecipients": [
    {
      "id": "tracker-recipient-uuid",
      "trackerId": "tracker-uuid",
      "recipientId": "recipient-uuid",
      "status": "read",
      "action": "Review and provide feedback",
      "remarks": "Sent for review",
      "seenAt": "2026-01-16T10:30:00Z",
      "readAt": "2026-01-16T10:35:00Z",
      "acknowledgedAt": null,
      "completedAt": null,
      "createdAt": "2026-01-16T10:00:00Z",
      "updatedAt": "2026-01-16T10:35:00Z",
      "recipient": {
        "id": "recipient-uuid",
        "recipientName": "Department A",
        "recipientCode": 101,
        "initial": "DA"
      }
    }
  ]
}
```

## API Endpoints

### Base Path: `/api/v2/tracker-recipients`

All endpoints require authentication and at least one of these roles: `receiving`, `admin`, `superadmin`

#### 1. Get All Tracker-Recipients for a Tracker

```
GET /trackers/:trackerId/recipients
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "trackerId": "uuid",
      "recipientId": "uuid",
      "status": "read",
      "seenAt": "...",
      "readAt": "...",
      "action": "Review and provide feedback",
      "remarks": "Sent for review",
      "recipient": { ... }
    }
  ]
}
```

#### 2. Get Specific Tracker-Recipient by ID

```
GET /:id
```

#### 3. Create or Update Tracker-Recipient Action

```
POST /trackers/:trackerId/recipients/:recipientId/action
```

**Request Body:**

```json
{
  "status": "read",
  "action": "Review and provide feedback",
  "remarks": "Please review by end of week"
}
```

#### 4. Update Tracker-Recipient Status

```
PATCH /:id/status
```

**Request Body:**

```json
{
  "status": "acknowledged",
  "remarks": "Acknowledged and will start action"
}
```

#### 5. Bulk Update All Tracker-Recipients for a Tracker

```
POST /trackers/:trackerId/recipients/bulk-update
```

**Request Body:**

```json
{
  "status": "seen",
  "action": "Standard action text for all recipients"
}
```

#### 6. Delete a Tracker-Recipient

```
DELETE /:id
```

**Note:** Requires admin or superadmin role

## Frontend Integration

### React Component Example

```javascript
import { useState, useEffect } from 'react';

function TrackerDetails({ trackerId }) {
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracker();
  }, [trackerId]);

  const fetchTracker = async () => {
    try {
      const response = await fetch(
        `/api/v2/trackers/${trackerId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setTracker(data);
    } catch (error) {
      console.error('Error fetching tracker:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (trackerRecipientId, newStatus) => {
    try {
      await fetch(
        `/api/v2/tracker-recipients/${trackerRecipientId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        }
      );
      // Refresh tracker data
      fetchTracker();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{tracker.documentTitle}</h1>
      <table>
        <thead>
          <tr>
            <th>Recipient</th>
            <th>Status</th>
            <th>Action</th>
            <th>Remarks</th>
            <th>Seen</th>
            <th>Read</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>
          {tracker.trackerRecipients.map(tr => (
            <tr key={tr.id}>
              <td>{tr.recipient.recipientName}</td>
              <td>
                <select 
                  value={tr.status} 
                  onChange={(e) => updateStatus(tr.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="seen">Seen</option>
                  <option value="read">Read</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="action_required">Action Required</option>
                  <option value="completed">Completed</option>
                </select>
              </td>
              <td>{tr.action}</td>
              <td>{tr.remarks}</td>
              <td>{tr.seenAt ? new Date(tr.seenAt).toLocaleDateString() : '-'}</td>
              <td>{tr.readAt ? new Date(tr.readAt).toLocaleDateString() : '-'}</td>
              <td>{tr.completedAt ? new Date(tr.completedAt).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TrackerDetails;
```

## Database Migration Steps

### 1. Run Migration

```bash
psql -U your_user -d your_database -f migrations/20260116-refactor-tracker-recipients.sql
```

### 2. If You Have Existing Data

If you previously used the old `recipient_actions` table, migrate data first:

```sql
INSERT INTO tracker_recipients (
  tracker_id, recipient_id, status, seen_at, read_at, 
  acknowledged_at, action, remarks, completed_at, created_at, updated_at
)
SELECT 
  tracker_id, recipient_id, status, seen_at, read_at,
  acknowledged_at, action, remarks, completed_at, created_at, updated_at
FROM recipient_actions;
```

### 3. Restart Application

The models will auto-load the new TrackerRecipient model.

## Advantages of Refactored Structure

1. **Simpler Data Model** - No separate junction table and action table
2. **Better API Response** - Nested data makes relationships clear
3. **Fewer Queries** - Single include gets all needed data
4. **Intuitive for UI** - Each recipient has their actions grouped
5. **Reduced Frontend Complexity** - No need to match IDs between arrays
6. **Better Performance** - Fewer joins required

## Status Values

| Status | Description |
|--------|-------------|
| `pending` | Action not yet viewed by recipient |
| `seen` | Recipient has seen the tracker (sets `seen_at`) |
| `read` | Recipient has read the tracker (sets `read_at`) |
| `acknowledged` | Recipient has acknowledged the tracker (sets `acknowledged_at`) |
| `action_required` | Action is required from recipient |
| `completed` | Action has been completed (sets `completed_at`) |

## Deprecation Notes

- The separate `recipient_actions` table is no longer used
- The old `/api/v2/recipient-actions` endpoints are replaced by `/api/v2/tracker-recipients`
- Update frontend code to use `trackerRecipients` instead of separate `recipients` and `recipientActions` arrays
