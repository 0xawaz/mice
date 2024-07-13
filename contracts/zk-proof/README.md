
```bash
# hacker hash "mice" > h1
echo -n mice | md5
51a75d7efc0fb0d097f684163a0db447

# company hash "mice" > h2 
echo -n mice | md5
51a75d7efc0fb0d097f684163a0db447

# zk-proof compares h1, h2
# success: h1-h2=0
# Failed:  h1-h2!=0

````



