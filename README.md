# CRM Admin Dashboard — Angular

Real Estate CRM admin panel built with Angular.

## Tech Stack
- Angular 17
- TypeScript
- REST API integration

## Setup

```powershell
cd admin-angular
npm install
npm start
```

Open `http://localhost:4200`

> Make sure the backend API is running at `http://localhost:5000`

## API Configuration

- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.production.ts`

## Pages

| Page | Description |
|------|-------------|
| Login | Admin authentication |
| Dashboard | Summary stats |
| Users | Sales executive account management |
| Leads | Lead creation and assignment |
| Customers | Customer profiles from leads |
| Properties | Project and unit management |
| Invoices | Invoice list |
| Payments | Manual payment verification |
| Commissions | Commission list |
| Reports | Basic reports |

## Branch Strategy

```
main    ← production
dev     ← integration/testing
istiak  ← lead dev working branch
```
