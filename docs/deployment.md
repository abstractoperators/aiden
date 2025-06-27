# Deployment Guide

This guide covers the complete deployment process from development to production.

## Prerequisites

- Access to [abstractoperators/eliza](https://github.com/abstractoperators/eliza) repository
- Access to [abstractoperators/aiden](https://github.com/abstractoperators/aiden) repository
- Valid auth token for staigen.space API

## Development & Testing

### 1. Create Eliza Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Create your feature branch on the [eliza repository](https://github.com/abstractoperators/eliza).

### 2. Local Testing

Test your changes locally using the Eliza frontend:

```bash
pnpm start:client --character=your-character
```

### 3. Merge to Staging

- Create pull request to `aiden-stable` branch
- Review and merge changes

## Staging Deployment

### 4. Update Aiden Repository

1. Create feature branch on [aiden repository](https://github.com/abstractoperators/aiden)
2. Update the eliza submodule to the correct commit hash:

   ```bash
   # Navigate to the eliza submodule directory
   cd path/to/eliza-submodule

   # Fetch latest changes
   git fetch origin

   # Checkout the specific commit from aiden-stable
   git checkout abc123def456  # replace with actual commit hash

   # Return to main repository
   cd ..

   # Stage and commit the submodule update
   git add eliza-submodule
   git commit -m "Update eliza submodule to commit abc123def456"
   ```

### 5. Build Runtime

Execute the "build and push parameterized runtime to staging and prod" action.

### 6. Get Authentication Token

1. Log into [staigen.space](https://staigen.space/)
2. Open browser Dev Tools (F12)
3. Navigate to the "Application" tab
4. Look under "Local Storage" for your `dynamic_authentication_token`
5. In the API docs, click the "Authorize" button (top right) and input this token

### 7. Retrieve Runtime List

Get all available runtimes:

```bash
GET https://api.staigen.space/runtimes
```

API documentation: [Get Runtimes](https://api.staigen.space/docs#/default/get_runtimes_runtimes_get)

### 8. Update Each Runtime

For each runtime in the list, perform an update using only the runtime ID:

```bash
PATCH https://api.staigen.space/runtimes/{runtime_id}
```

**Required parameter:**

- `runtime_id` (string, UUID format) - passed in the URL path

API documentation: [Update Runtime](https://api.staigen.space/docs#/default/update_runtime_runtimes__runtime_id__patch)

### 9. Monitor Update Status (Optional)

Check the status of each update using the `celery_task_id`:

```bash
GET https://api.staigen.space/tasks/{task_id}
```

API documentation: [Get Task Status](https://api.staigen.space/docs#/default/get_task_status_tasks__task_id__get)

## Production Deployment

### 10. Merge to Production

- Create pull request to `main` branch
- Review and merge changes

### 11. Deploy to Production

Repeat steps 6-9 for the production environment:

1. Execute "build and push parameterized runtime to staging and prod" action
2. Get fresh auth token
3. Retrieve production runtime list
4. Update each production runtime
5. Monitor update status as needed

## Notes

- Always test thoroughly in staging before deploying to production
- Keep auth tokens secure and refresh them as needed
- Monitor deployment status to ensure successful updates

## Troubleshooting

### If Runtime Update Fails

1. Check task status: `GET https://api.staigen.space/tasks/{task_id}`
2. If status shows error, retry the update
3. If multiple failures, contact DevOps team

### Rollback Procedure

If deployment causes issues:

1. Identify the previous working commit hash
2. Revert eliza submodule:
   ```bash
   cd path/to/eliza-submodule
   git checkout previous-commit-hash
   cd ..
   git add eliza-submodule
   git commit -m "Rollback eliza submodule to previous-commit-hash"
   ```
3. Re-run build and update process with previous version
4. Verify all runtimes are functioning
