# Script Details

These are various rough typescript and shell programs for exploring patterns.
Mostly LLM generated.

## Notable Utilites
 - `rand-lifelike-rule` - Generates random life-like rules. e.g.
```
deno rand-lifelike-rule.ts 10 > rules.txt
```

 - `parrallel_gen.sh` - Runs `gen_one.sh` scripts in parrallel until all rules 
in supplied file have been processed. e.g.
```
sh parrallel_gen.sh rules.txt
````

basic_rules.txt
gen_one.sh
parrallel_gen.sh
rand-lifelike-rule.ts
README.md
