#!/bin/bash

echo "Testing Entity API..."
echo "===================="
echo ""

echo "1. Testing GET /entity"
curl -s http://localhost:3000/entity | jq '.'

echo ""
echo "2. Testing GET /entity (first item only)"
curl -s http://localhost:3000/entity | jq '.data[0]'

echo ""
echo "3. Total records:"
curl -s http://localhost:3000/entity | jq '.total // .data | length'
