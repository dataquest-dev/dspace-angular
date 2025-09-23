# Matomo Statistics Configuration

## Enable/Disable Matomo

### To Disable Matomo (Default)
```typescript
matomo: {
  enabled: false,
  hostUrl: 'https://your-matomo-server.com/',
  siteId: '1',
  dimensionId: 1
}
```

### To Enable Matomo
```typescript
matomo: {
  enabled: true,
  hostUrl: 'https://your-matomo-server.com/',
  siteId: '1',
  dimensionId: 1
}
```

## Files to Modify

- environment.test.ts
- default-app-config.ts
- config.example.yml

## After Changes

1. Restart the application
2. Clear browser cache

When disabled: No Matomo scripts load, statistics page shows "disabled" message.
When enabled: Matomo tracking works normally.