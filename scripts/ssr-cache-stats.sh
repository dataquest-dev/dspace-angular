#!/bin/bash
# Requires cache.serverSide.stats.enabled and stats.port > 0 in config.prod.yml.
# Usage: bash scripts/ssr-cache-stats.sh [container] [base-port] [workers]
C=${1:-dspace-angular443}
BASE=${2:-4001}
N=${3:-8}

for ((i = 0; i < N; i++)); do
  p=$((BASE + i))
  docker exec "$C" node -e "fetch('http://127.0.0.1:$p/app/cache-stats').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(d=>console.log('w'+d.instance,'up',d.uptimeSeconds+'s','rss',Math.round(d.memory.rss/1e6)+'MB',d.caches.map(c=>c.name+':'+(c.enabled?'on':'off')+' n='+c.entryCount+' stale='+c.staleCount+' '+Math.round(c.totalHtmlBytes/1024)+'KB/max'+c.maxEntries+' hits='+c.hits+' misses='+c.misses+' hit='+(c.hitRate==null?'n/a':(100*c.hitRate).toFixed(1)+'%')).join(' | '))).catch(e=>{console.error('$p ERR',e.message);process.exitCode=1})"
done
