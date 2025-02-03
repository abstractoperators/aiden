echo "Starting nginx"
nginx -g "daemon off;" &

echo "Starting node server"
pnpm start --characters="app/characters/eve.character.json" &
pnpm start:client --host