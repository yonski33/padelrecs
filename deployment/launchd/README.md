# Local scheduled jobs (launchd, the owner's Mac)

## Daily padel and pickleball shop prices
`padel-shop-prices.sh` re-reads every padel shop page and updates `padelrecs.creator_prices`. It uses no AI and keeps
no price history. Pages hide any price checked more than 3 days ago, so if this job stops, the prices disappear by
themselves. It runs daily at 06:00 from its own checkout of main and takes about 4 minutes.
Since 2026-11-26 the same job also runs `scripts/pickleball-shop-prices.mts` (every non-Amazon `pickleballrecs.creator_prices`
row; Shopify price from the product's `.json`, stock from `.js`; other shops from schema.org Product). Same 3-day hide.

One-time setup (run in Terminal):
```
git -C /Users/yonatan/Documents/ChatGPT/padelrecs/work/padelrecs-vercel worktree add --detach ~/padelrecs-jobs origin/main
ln -s /Users/yonatan/Documents/ChatGPT/padelrecs/work/padelrecs-vercel/.env.local ~/padelrecs-jobs/.env.local
cp ~/padelrecs-jobs/deployment/launchd/com.padelrecs.shop-prices.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.padelrecs.shop-prices.plist
```
- Run it now: `launchctl kickstart gui/$(id -u)/com.padelrecs.shop-prices`
- Log: `/tmp/padelrecs-shop-prices.log`
- Stop it: `launchctl bootout gui/$(id -u)/com.padelrecs.shop-prices`

## Amazon prices twice a day (skin, disc golf, pickleball)
`amazon-prices.sh` runs `scripts/amazon-prices.mts --apply --saved-only` for SkinRecs, DiscGolfRecs and PickleballRecs at
06:30 and 18:30, from the same `~/padelrecs-jobs` checkout. Pages show a saved Amazon price only while it is under 24 hours
old (Amazon's rule), so if this job stops the prices drop off by themselves and pages show a plain Amazon link. Current
price only, no history, one call every 1.2 s with a backoff on 429. Only products with a saved ASIN are priced: new ASINs
come in through a reviewed run (`scripts/amazon-prices.mts` without `--saved-only`, dry run first), never from this job.

One-time setup (after the shop-price setup above):
```
cp ~/padelrecs-jobs/deployment/launchd/com.padelrecs.amazon-prices.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.padelrecs.amazon-prices.plist
```
- Run it now: `launchctl kickstart gui/$(id -u)/com.padelrecs.amazon-prices`
- Log: `/tmp/padelrecs-amazon-prices.log`
- Stop it: `launchctl bootout gui/$(id -u)/com.padelrecs.amazon-prices`
