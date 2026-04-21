# SmartSeason Field Monitoring System

## Setup

### Backend
```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev        # runs on :4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # runs on :5173
```

### Demo Credentials

| Role  | Email                      | Password  |
|-------|----------------------------|-----------|
| Admin | admin@smartseason.com      | admin123  |
| Agent | alice@smartseason.com      | agent123  |
| Agent | brian@smartseason.com      | agent123  |

## Status Logic

Status is computed at read-time from `current_stage` + most recent observation date:

| Condition | Status |
|-----------|--------|
| Stage = Harvested | **Completed** |
| Stage = Ready or Growing, no observation in 7+ days | **At Risk** |
| Stage = Planted, 14+ days since planting, no observation in 7+ days | **At Risk** |
| Everything else | **Active** |

Think of it like a smoke detector — it only fires when both the crop is mature **and** no one has checked in recently.

## Design Decisions

- **PostgreSQL**: Zero-config, perfect for assessment scope
- **Synchronous DB calls**: Keeps code linear and readable — no async/await noise for simple CRUD
- **Status computed on read**: No stored computed columns → always fresh, no sync bugs
- **Role guard in middleware + controller**: Defense in depth without a permissions library
- **No over-abstraction**: No ORM, no service layer — direct SQL in controllers is readable at this scale