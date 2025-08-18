#!/bin/bash

# Database cleanup script to remove duplicate entries from EPersonGroup2EPerson table
# This resolves the Flyway migration error: "Key (eperson_group_id, eperson_id) is duplicated"

INSTANCE=${1:-8563}
DDBNAME="dspacedb${INSTANCE}"

echo "Starting database cleanup for instance ${INSTANCE}..."

# SQL script to remove duplicates from EPersonGroup2EPerson table
CLEANUP_SQL="
-- Remove duplicate entries from EPersonGroup2EPerson table
-- Keep only the first occurrence of each (eperson_group_id, eperson_id) pair
DELETE FROM EPersonGroup2EPerson
WHERE ctid NOT IN (
    SELECT min(ctid)
    FROM EPersonGroup2EPerson
    GROUP BY eperson_group_id, eperson_id
);

-- Verify cleanup
SELECT COUNT(*) as total_records FROM EPersonGroup2EPerson;
SELECT COUNT(DISTINCT eperson_group_id, eperson_id) as unique_pairs FROM EPersonGroup2EPerson;
"

echo "Executing duplicate cleanup..."
docker exec $DDBNAME /bin/bash -c "psql -p 10563 -U dspace -d dspace -c \"$CLEANUP_SQL\""

if [ $? -eq 0 ]; then
    echo "Database cleanup completed successfully"
else
    echo "Database cleanup failed"
    exit 1
fi
