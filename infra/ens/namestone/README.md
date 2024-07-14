# NameStone

```bash
# get API key
API_KEY ="xxxx"
WALLET  ="yyyy"

# test with curl
curl -X POST \
     -H 'Content-Type: application/json' \
     -H 'Authorization: ${API_KEY}' \
     -d '{
          "domain":"mice.sh",
          "name":"catwomen",
          "address":"${WALLET}"
        }' \
     https://namestone.xyz/api/public_v1/set-name
```