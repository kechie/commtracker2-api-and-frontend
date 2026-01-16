# Recipient Actions Feature

## Overview

The Recipient Actions feature tracks actions and status updates for recipients related to trackers. This allows you to monitor:

- **Status**: pending, seen, read, acknowledged, action_required, completed
- **Timestamps**: When each action was taken
- **Action**: Specific action assigned to recipient
- **Remarks**: Notes or comments from recipients

## Database Schema

### recipient_actions Table

```sql
CREATE TABLE recipient_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'pending',
  seen_at TIMESTAMP,
  read_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  action VARCHAR(255),
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

**Indexes:**

- `tracker_id` - for querying actions by tracker
- `recipient_id` - for querying actions by recipient
- `status` - for filtering by status
- `(tracker_id, recipient_id)` - unique constraint to ensure one action per tracker-recipient pair

## Status Values

| Status | Description |
|--------|-------------|
| `pending` | Action not yet viewed by recipient |
| `seen` | Recipient has seen the tracker (sets `seen_at`) |
| `read` | Recipient has read the tracker (sets `read_at`) |
| `acknowledged` | Recipient has acknowledged the tracker (sets `acknowledged_at`) |
| `action_required` | Action is required from recipient |
| `completed` | Action has been completed (sets `completed_at`) |

## API Endpoints

### Base Path: `/api/v2/recipient-actions`

All endpoints require authentication and at least one of these roles: `receiving`, `admin`, `superadmin`

#### 1. Get All Actions for a Tracker

```
GET /trackers/:trackerId/recipient-actions
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
      "seenAt": "2026-01-16T10:30:00Z",
      "readAt": "2026-01-16T10:35:00Z",
      "acknowledgedAt": null,
      "action": "Review and provide feedback",
      "remarks": "Sent for review",
      "completedAt": null,
      "createdAt": "2026-01-16T10:00:00Z",
      "updatedAt": "2026-01-16T10:35:00Z",
      "recipient": {
        "id": "uuid",
        "recipientName": "Department A",
        "recipientCode": 101,
        "initial": "DA"
      }
    }
  ]
}
```

#### 2. Get Specific Action by ID

```
GET /:actionId
```

#### 3. Create or Update Action for a Tracker-Recipient Pair

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

#### 4. Update Action Status

```
PATCH /:actionId/status
```

**Request Body:**

```json
{
  "status": "acknowledged",
  "remarks": "Acknowledged and will start action"
}
```

#### 5. Bulk Update All Actions for a Tracker

```
POST /trackers/:trackerId/recipient-actions/bulk-update
```

**Request Body:**

```json
{
  "status": "seen",
  "action": "Standard action text for all recipients"
}
```

#### 6. Delete an Action

```
DELETE /:actionId
```

**Note:** Requires admin or superadmin role

## Frontend Integration

### Usage Example in React

```javascript
import { useState, useEffect } from 'react';

function TrackerRecipientActions({ trackerId }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActions();
  }, [trackerId]);

  const fetchActions = async () => {
    try {
      const response = await fetch(
        `/api/v2/recipient-actions/trackers/${trackerId}/recipient-actions`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setActions(data.data);
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (actionId, newStatus) => {
    try {
      const response = await fetch(
        `/api/v2/recipient-actions/${actionId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        }
      );
      const data = await response.json();
      setActions(actions.map(a => a.id === actionId ? data.data : a));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Recipient</th>
          <th>Status</th>
          <th>Action</th>
          <th>Remarks</th>
          <th>Seen At</th>
          <th>Read At</th>
          <th>Completed At</th>
        </tr>
      </thead>
      <tbody>
        {actions.map(action => (
          <tr key={action.id}>
            <td>{action.recipient.recipientName}</td>
            <td>
              <select 
                value={action.status} 
                onChange={(e) => updateStatus(action.id, e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="seen">Seen</option>
                <option value="read">Read</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="action_required">Action Required</option>
                <option value="completed">Completed</option>
              </select>
            </td>
            <td>{action.action}</td>
            <td>{action.remarks}</td>
            <td>{action.seenAt ? new Date(action.seenAt).toLocaleDateString() : '-'}</td>
            <td>{action.readAt ? new Date(action.readAt).toLocaleDateString() : '-'}</td>
            <td>{action.completedAt ? new Date(action.completedAt).toLocaleDateString() : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TrackerRecipientActions;
```

## Setup Instructions

### 1. Run Migration

Execute the migration file to create the table:

```bash
psql -U your_user -d your_database -f migrations/20260116-create-recipient-actions.sql
```

Or use your migration tool if you have one configured.

### 2. Verify Model Loading

The `RecipientAction` model will be automatically loaded by the models/index.js file since it's in the models directory.

### 3. Test the API

Use curl or Postman to test:

```bash
# Get all actions for a tracker
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5007/api/v2/recipient-actions/trackers/TRACKER_ID/recipient-actions

# Update action status
curl -X PATCH -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"read"}' \
  http://localhost:5007/api/v2/recipient-actions/ACTION_ID/status
```

## Design Decisions

1. **One Action Per Tracker-Recipient Pair**: The unique constraint on `(tracker_id, recipient_id)` ensures only one action record exists per pair, simplifying updates.

2. **Automatic Timestamps**: When status changes, relevant timestamp fields are automatically set (e.g., `seenAt`, `readAt`, etc.).

3. **Cascade Deletes**: Deleting a tracker or recipient automatically deletes related actions.

4. **Soft Deletes**: Uses `deleted_at` field for paranoid deletes, maintaining audit trail.

5. **Transaction Safety**: Create/update operations use transactions to maintain data consistency.

## Future Enhancements

- Add action history tracking (audit log of status changes)
- Add assignment tracking (who assigned the action)
- Add notification system for status changes
- Add action category/type field
- Add priority field for actions
- Add due date field for tracking deadlines
- Generate reports on recipient action compliance
