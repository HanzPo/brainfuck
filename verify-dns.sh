#!/bin/bash

echo "Checking DNS for brainfuck.hanzpo.com..."
echo "========================================"
echo ""

echo "1. Checking with Google DNS (8.8.8.8):"
nslookup brainfuck.hanzpo.com 8.8.8.8

echo ""
echo "2. Checking with Cloudflare DNS (1.1.1.1):"
nslookup brainfuck.hanzpo.com 1.1.1.1

echo ""
echo "3. Checking CNAME record:"
dig brainfuck.hanzpo.com CNAME +short

echo ""
echo "Expected result: brainfuck.hanzpo.com should resolve to hanzpo.github.io" 