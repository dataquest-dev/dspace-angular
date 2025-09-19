# Matomo Statistics Configuration

## Enable/Disable Matomo

### To Disable Matomo (Default)
Edit `src/environments/environment.ts`:
```typescript
matomo: {
  enabled: false,
  hostUrl: 'https://your-matomo-server.com/',
  siteId: '1',
  dimensionId: 1
}
```

### To Enable Matomo
Edit `src/environments/environment.ts`:
```typescript
matomo: {
  enabled: true,
  hostUrl: 'https://your-matomo-server.com/',
  siteId: '1',
  dimensionId: 1
}
```

## Files to Modify

- **Development**: `src/environments/environment.ts`
- **Production**: `src/environments/environment.production.ts`
- **Global/Server-side**: `config/config.example.yml` (and `config/config.yml` in production)
- **Runtime (if applicable)**: `config.json`
> **Note:** The `enabled` flag for Matomo may be present in multiple configuration files. Ensure you update all relevant files (`environment.ts`, `environment.production.ts`, `config/config.example.yml`, and any runtime `config.json`) to avoid conflicts or unexpected behavior.

## After Changes

1. Restart the application
2. Clear browser cache

When disabled: No Matomo scripts load, statistics page shows "disabled" message.
When enabled: Matomo tracking works normally.
