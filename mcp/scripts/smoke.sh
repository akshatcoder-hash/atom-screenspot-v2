#!/bin/bash
# usage: scripts/smoke.sh <png> "<instruction>"   (MCP at ${MCP_URL:-http://localhost:3000/mcp})
URL=${MCP_URL:-http://localhost:3000/mcp}
rpc() { curl -s "$URL" -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -d "$1" | sed -n 's/^data: //p'; }
echo "--- tools/list"; rpc '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 -c 'import sys,json;[print(t["name"],"|",list(t["inputSchema"]["properties"]),"|",t.get("_meta",{}).get("ui")) for t in json.load(sys.stdin)["result"]["tools"]]'
echo "--- atom_health"; rpc '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"atom_health","arguments":{}}}'
echo; echo "--- ground"; rpc "$(python3 -c 'import json,sys;print(json.dumps({"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"ground","arguments":{"image_path":sys.argv[1],"instruction":sys.argv[2]}}}))' "$1" "$2")" | python3 -c 'import sys,json;r=json.load(sys.stdin)["result"];m=r.get("_meta",{});[m.__setitem__(k,str(v)[:40]+"...(%d chars)"%len(str(v))) for k,v in m.items() if len(str(v))>80];print(json.dumps(r,indent=1))'
