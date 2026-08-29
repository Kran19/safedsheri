#!/bin/bash
docker exec safedsheri-postgres psql -U postgres -d safedsheri -c 'SELECT method, SUM(amount) FROM "Payment" WHERE status = '\'CONFIRMED\'' GROUP BY method;'
