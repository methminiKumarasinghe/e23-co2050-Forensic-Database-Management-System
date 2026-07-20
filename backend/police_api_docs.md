# Police Dashboard API Documentation

This document provides example API requests and responses for the Police Dashboard modules.

## Authentication
All requests require a Bearer token in the `Authorization` header. The user must have the `POLICE` role.

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Module 1 - Dashboard

### Get Dashboard Statistics
`GET /police/dashboard`

**Response:**
```json
{
  "stats": {
    "total_assigned_cases": 12,
    "open_cases": 4,
    "closed_cases": 8,
    "pending_mlef_requests": 2,
    "completed_mlef_requests": 5,
    "total_evidence_items": 34,
    "pending_laboratory_results": 1
  },
  "recentActivities": [
    {
      "activity_id": "uuid",
      "activity_type": "Evidence Added",
      "description": "Evidence (Knife) collected.",
      "activity_time": "2026-07-20T10:05:00Z"
    }
  ]
}
```

---

## Module 2 - Police Case Management

### Create Case
`POST /police/cases`

**Request Body:**
```json
{
  "station_id": "b3c3c1e2-5a7a-4a2b-8c8a-1b4a2f8c5b1b",
  "case_number": "POL/2026/001",
  "case_type": "HOMICIDE",
  "title": "Suspicious Death at Main St",
  "description": "Body found in apartment",
  "date_reported": "2026-07-20T10:00:00Z"
}
```

**Response:**
```json
{
  "case_id": "uuid",
  "station_id": "b3c3c1e2-5a7a-4a2b-8c8a-1b4a2f8c5b1b",
  "status_id": 1,
  "case_number": "POL/2026/001",
  "case_type": "HOMICIDE",
  "title": "Suspicious Death at Main St",
  "description": "Body found in apartment",
  "date_reported": "2026-07-20T10:00:00.000Z",
  "created_at": "2026-07-20T10:05:00.000Z",
  "updated_at": "2026-07-20T10:05:00.000Z"
}
```

---

## Module 5 - Evidence Management

### Add Evidence
`POST /police/cases/:id/evidence`

**Request Body:**
```json
{
  "evidence_type": "Weapon",
  "description": "Kitchen knife found at scene",
  "collected_date": "2026-07-20T10:30:00Z",
  "current_status": "COLLECTED"
}
```

**Response:**
```json
{
  "evidence_id": "uuid",
  "case_id": "uuid",
  "evidence_type": "Weapon",
  "description": "Kitchen knife found at scene",
  "collected_by": "uuid",
  "collected_date": "2026-07-20T10:30:00.000Z",
  "current_status": "COLLECTED"
}
```

---

## Module 6 - Evidence Photos

### Upload Evidence Photos
`POST /police/evidence/:id/photos`

**Request (multipart/form-data):**
- `photos`: [File1.jpg, File2.jpg]
- `description`: "Photos of the knife"

**Response:**
```json
[
  {
    "photo_id": "uuid",
    "evidence_id": "uuid",
    "file_path": "uploads/evidence/photos-1712000000000-123456.jpg",
    "uploaded_at": "2026-07-20T10:35:00.000Z",
    "uploaded_by": "uuid",
    "description": "Photos of the knife"
  }
]
```

---

## Module 8 - MLEF Requests

### Request MLEF
`POST /police/mlef`

**Request Body:**
```json
{
  "case_id": "uuid",
  "patient_id": "uuid",
  "hospital_id": "uuid",
  "reason": "Victim requires immediate examination for assault."
}
```

**Response:**
```json
{
  "mlef_id": "uuid",
  "case_id": "uuid",
  "patient_id": "uuid",
  "requesting_officer": "uuid",
  "hospital_id": "uuid",
  "request_date": "2026-07-20T11:00:00.000Z",
  "reason": "Victim requires immediate examination for assault.",
  "status": "PENDING"
}
```
